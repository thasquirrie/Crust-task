const AppError = require('../middlewares/appError');

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}`;
  return new AppError(message, 400);
};

const handleDuplicateField = (err) => {
  // console.log({ err });
  const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Email already exist. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  console.log(err.errors);
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Token has expired. Please log in again', 409);
};

const sendErrorDev = (err, req, res) => {
  console.log('Url:', req.originalUrl);
  console.log(err.message);
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Uh oh! Something wrong occured.',
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {

      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
      });
    }
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).render('error', {
        title: 'Something went wrong',
        msg: err.message,
      });
    } else {

      res.status(500).render('error', {
        title: 'Something went wrong',
        msg: 'Please try again',
      });
    }
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();
  if (err.name === 'JsonWebTokenError') err = handleJWTError();
  if (err.message.includes('duplicate key')) {
    err = handleDuplicateField(err);
  }
  if (err.name === 'CastError') err = handleCastErrorDB(err);
  sendErrorDev(err, req, res);
};
