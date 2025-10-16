import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import User from '../models/userModel.js';
import AppError from '../utils/AppError.js';
import catchAsync from '../utils/catchAsync.js';
import * as handlerFactory from './handlerFactory.js';

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg') {
    return cb(new AppError('File type unsupported', 400));
  }
  return cb(null, true);
};
export const uploadPhoto = multer({ storage, fileFilter }).single('photo');

export const processPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  const filename = `${Date.now()}${path.extname(req.file.originalname)}`;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const saveTo = path.resolve(__dirname, '../public/img/users');
  const filePath = path.join(saveTo, filename);

  await sharp(req.file.buffer)
    .resize({ width: 500, height: 500 })
    .jpeg({ quality: 90 })
    .toFile(filePath);

  req.file.filename = filename;

  next();
});

export const getAllUsers = handlerFactory.getAll(User);
export const deleteUser = handlerFactory.deleteOne(User);
export const getUser = handlerFactory.getOne(User);
export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
const filterReqObj = (currentObj, ...updateableFields) => {
  const filteredObj = {};
  Object.keys(currentObj).forEach((field) => {
    if (updateableFields.includes(field)) {
      filteredObj[field] = currentObj[field];
    }
  });
  return filteredObj;
};

export const updateMe = catchAsync(async (req, res, next) => {
  // 1. Prevent password updates
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /update-password.',
        400
      )
    );
  }
  // filter the object from unwanted fields
  const filteredObj = filterReqObj(req.body, 'name', 'email');
  if (req.file) {
    filteredObj['photo'] = req.file.filename;
  }
  // update needed fields
  const user = await User.findByIdAndUpdate(req.user.id, filteredObj, {
    new: true,
    runValidators: true
  });
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

export const deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      active: false
    },
    {
      new: true,
      validateBeforeSave: false
    }
  );

  if (!user) {
    return next(
      new AppError('Cant delete current user, please login again', 401)
    );
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
// 200 OK → success (read/update).

// 201 Created → when creating a new resource.

// 204 No Content → when deleting.

// 401 unauthorized  invalid authentication credentials for the requested resource.

// 403 forbidden invalid authorization

// 400 Bad Request → invalid data.

// 404 Not Found → resource doesn’t exist.

// 500 Internal Server Error → unexpected server error (not for normal responses).
