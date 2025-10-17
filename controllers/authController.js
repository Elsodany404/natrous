import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../models/userModel.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import Email from '../utils/email.js';

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE_DATE
  });
};

export const createSendToken = function (user, req, statusCode, res) {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + Number(process.env.COOKIE_EXPIRE_DATE) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // make the browser dont access or modifiy cookie
    secure: req.secure || req.headers('x-forwarded-proto') === 'https'
  };
  res.cookie('jwt', token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};
export const signUp = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    passwordConfirm
  });
  const mailObj = new Email(user, 'http://127.0.0.1:3000/me');
  await mailObj.sendWelcome();
  createSendToken(user, req, 200, res);
});
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // if the email and password exist in the req
  if (!email || !password) {
    return next(new AppError('Insert your email and password', 400));
  }
  // if the user exist
  const user = await User.findOne({
    email
  }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // sending token
  createSendToken(user, req, 200, res);
});

export const protect = catchAsync(async (req, res, next) => {
  let token;

  // ✅ 1. Get token either from header or cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  // ✅ 2. If no token, reject
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // ✅ 3. Verify token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );
  // ✅ 4. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }
  // ✅ 5. Check if user changed password after token issued
  if (currentUser.checkPasswordChanged(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }
  // ✅ 6. Grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

export const isLoggedIn = async (req, res, next) => {
  let token;
  let currentUser;
  // ✅ 1. Get token either from header or cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  try {
    // ✅ 3. Verify token
    const decoded = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET_KEY
    );
    currentUser = await User.findById(decoded.id);
    // ✅ 5. Check if user changed password after token issued
    if (currentUser.checkPasswordChanged(decoded.iat)) {
      return next(
        new AppError(
          'User recently changed password! Please log in again.',
          401
        )
      );
    }
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  } catch (err) {
    next();
  }
};

export const roleRestrictions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

export const forgotPassword = catchAsync(async (req, res, next) => {
  // (email) sent via body
  // check if the user exits
  const user = await User.findOne({
    email: req.body.email
  });
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }
  // creating token
  // set resetPasswordToken, set resetPasswordTokenExpires
  const resetToken = user.createResetPasswordToken();
  await user.save({
    validateBeforeSave: false
  }); // turn off validation of all props
  // sending email with reset token
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;
  // if there is any error of the block itself
  try {
    const mailObj = new Email(user, resetURL);
    await mailObj.send(
      'passwordReset',
      'Reset password token valid for 10 min'
    );
    res.status(200).json({
      status: 'success',
      token: 'url to reset password sent to your email'
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({
      validateBeforeSave: false
    });
    next(
      new AppError(
        `There was an error sending the email. Try again later!`,
        500
      )
    );
  }
});
export const resetPassword = catchAsync(async (req, res, next) => {
  if (!req.body) {
    return next(new AppError('please provide new password and confirm it!'));
  }
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: {
      $gt: Date.now()
    }
  });
  if (!user) {
    return next(new AppError('Token is invalid or has expired'));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  createSendToken(user, req, 200, res);
});

export const logout = catchAsync(async (req, res, next) => {
  res.clearCookie('jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });
  res.status(200).json({
    status: 'success'
  });
});
export const updateUserPassword = catchAsync(async (req, res, next) => {
  // req.user from protect authorization middleware
  // req.body.password

  // check for user existant
  const { oldPassword, newPassword, newPasswordConfirm } = req.body;
  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    return next(new AppError('Please login again!', 404));
  }
  // check if the password sent was corrected
  if (!(await user.correctPassword(oldPassword, user.password))) {
    return next(new AppError('Current password is incorrect!', 400));
  }
  // check if the password and confirm password was equal via pre hook
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();
  // create new token and send it to the user
  createSendToken(user, req, 200, res);
});
