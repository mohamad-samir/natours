const AppError = require('../utils/appError'); // Custom error class for application-specific errors

// Handles MongoDB cast errors (e.g., invalid ObjectId)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`; // Constructs a user-friendly error message
  return new AppError(message, 400); // Returns a new AppError with the constructed message and a 400 status code
};

// Handles MongoDB duplicate field errors (e.g., duplicate keys)
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]; // Extracts the duplicate field value from the error message
  //console.log(value); // Logs the duplicate value to the console for debugging

  const message = `Duplicate field value: ${value}. Please use another value!`; // Constructs a user-friendly error message
  return new AppError(message, 400); // Returns a new AppError with the constructed message and a 400 status code
};

// Handles MongoDB validation errors (e.g., required fields, min length)
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message); // Maps validation error messages into an array

  const message = `Invalid input data. ${errors.join('. ')}`; // Constructs a user-friendly error message
  return new AppError(message, 400); // Returns a new AppError with the constructed message and a 400 status code
};

// Handles invalid JWT errors
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401); // Returns a new AppError with a 401 status code

// Handles expired JWT errors
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401); // Returns a new AppError with a 401 status code

// Sends error response in development environment
const sendErrorDev = (err, req, res) => {
  // For API requests
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // For rendered website requests
  console.error('ERROR 💥', err); // Logs the error to the console for debugging
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

// Sends error response in production environment
const sendErrorProd = (err, req, res) => {
  // For API requests
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // Programming or unknown error: don't leak error details
    console.error('ERROR 💥', err); // Logs the error to the console for debugging
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // For rendered website requests
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    console.log(err); // Logs the error to the console for debugging
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  // Programming or unknown error: don't leak error details
  console.error('ERROR 💥', err); // Logs the error to the console for debugging
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

// Global error handling middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; // Sets default status code to 500 if not already set
  err.status = err.status || 'error'; // Sets default status to 'error' if not already set

  // Error handling for development environment
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res); // Sends detailed error response for development
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err }; // Creates a shallow copy of the error object
    error.message = err.message; // Copies the error message

    // Handles specific known error types
    if (error.name === 'CastError') error = handleCastErrorDB(error); // Handles MongoDB cast errors
    if (error.code === 11000) error = handleDuplicateFieldsDB(error); // Handles MongoDB duplicate field errors
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error); // Handles MongoDB validation errors
    if (error.name === 'JsonWebTokenError') error = handleJWTError(); // Handles invalid JWT errors
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError(); // Handles expired JWT errors

    sendErrorProd(error, req, res); // Sends minimal error response for production
  }
};
