// Import the custom AppError class from the utils directory
const AppError = require('./../utils/appError');

// Handle errors related to invalid MongoDB ObjectId values
const handleCastErrorDB = err => {
  // Create a meaningful error message that includes the invalid path and value
  const message = `Invalid ${err.path}: ${err.value}.`;
  // Return a new AppError instance with the message and a 400 Bad Request status code
  return new AppError(message, 400);
};

// Handle errors when a JSON Web Token is invalid
const handleJWTError = () =>
  new AppError('Invalid web token. Please log in again.', 401);

// Handle errors when a JSON Web Token has expired
const handleJWTExpiredError = () =>
  new AppError('Expired web token. Please log in again.', 401);

// Handle errors when there are duplicate fields in the database
const handleDuplicateFieldsDB = err => {
  // Extract the duplicate field value from the error message using a regular expression
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);

  // Create a meaningful error message that includes the duplicate field value
  const message = `Duplicate field value: ${value}. Please use another value!`;
  // Return a new AppError instance with the message and a 400 Bad Request status code
  return new AppError(message, 400);
};

// Handle validation errors from MongoDB
const handleValidationErrorDB = err => {
  // Extract all validation error messages into an array
  const errors = Object.values(err.errors).map(el => el.message);

  // Create a meaningful error message that includes all validation errors
  const message = `Invalid input data. ${errors.join('. ')}`;
  // Return a new AppError instance with the message and a 400 Bad Request status code
  return new AppError(message, 400);
};

// Send detailed error information in the development environment
const sendErrorDev = (err, res) => {
  // Send a JSON response with the error status, message, stack trace, and other details
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Send minimal error information in the production environment
const sendErrorProd = (err, res) => {
  // Check if the error is operational (i.e., an anticipated error that we can handle gracefully)
  if (err.isOperational) {
    // Send a JSON response with the error status and message
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  } else {
    // For programming or unknown errors, don't leak error details to the client

    // 1) Log the error for debugging purposes
    console.error('ERROR 💥', err);

    // 2) Send a generic error message to the client
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  // Set default values for the error status code (500 for server error) and status ('error')
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Check the current environment (development or production)
  if (process.env.NODE_ENV === 'development') {
    // In development mode, send detailed error information
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // In production mode, create a copy of the error object
    let error = { ...err };

    // Handle specific error types and convert them to operational errors
    // Check if the error is a MongoDB CastError (invalid ObjectId)
    if (error.name === 'CastError') error = handleCastErrorDB(error);

    // Check if the error code is 11000, which indicates a duplicate key error in MongoDB
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);

    // Check if the error is a MongoDB validation error
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);

    // Check if the error is due to an invalid JSON Web Token (JWT)
    if (error.name === 'JsonWebTokenError') error = handleJWTError();

    // Check if the error is due to an expired JSON Web Token (JWT)
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    // Send minimal error information in production mode
    sendErrorProd(error, res);
  }
};
