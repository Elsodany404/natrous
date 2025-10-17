import AppError from '../utils/AppError.js';

const handleJWTVerification = () => new AppError('Invalid token');
const handleExpiredJWT = () => new AppError('jwt expired');

const handleValidationError = (err, req, res) => {
  const { errors } = err;
  const errorMessages = [];
  Object.values(errors).forEach((obj) => {
    errorMessages.push(obj.message);
  });
  const message = errorMessages.join('. ');
  return new AppError(message, 400);
};
const handleDuplicateKeyError = (err, req, res) => {
  const matches = err.message.match(/"([^"]*)"/g) || [];
  const message = `Duplicate key error: ${matches.join(', ')}`;
  return new AppError(message, 400);
};
const handleCastError = (err, req, res) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400); // bad request
};

const sendProdError = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      return res.status(500).json({
        status: 'error',
        message: 'somthing went wrong'
      });
    }
  } else {
    if (err.isOperational) {
      console.log(err);
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
      });
    } else {
      console.error('ERROR 💥', err);
      return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later.'
      });
    }
  }
};
const sendDevError = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      err: err,
      stack: err.stack
    });
  } else {
    return res
      .status(err.statusCode)
      .render('error', { title: 'Somthing went wrong', msg: err.message });
  }
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendDevError(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(Object.getPrototypeOf(err));
    Object.assign(error, err);
    if (err.name === 'CastError') error = handleCastError(err, req, res);
    if (err.code === 11000) error = handleDuplicateKeyError(err, req, res);
    if (err.name === 'ValidationError') {
      error = handleValidationError(err, req, res);
    }
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTVerification(err, req, res);
    }
    if (err.name === 'TokenExpiredError') {
      error = handleExpiredJWT(err, req, res);
    }
    sendProdError(error, req, res);
  }
};
export default globalErrorHandler;
