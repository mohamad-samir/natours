const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1)GLOBAL MIDDLEWARES
app.use(helmet()); // Apply helmet middleware for enhanced security

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  max: 100, // Maximum number of requests allowed from a single IP address
  windowMs: 60 * 60 * 1000, // Time window for limiting requests (in milliseconds)
  message: 'Too many requists from this IP'
});

app.use('/api', limiter); // Apply rate limiting middleware to API routes

// Middleware to parse incoming requests with JSON payloads
app.use(express.json({ limit: '10kb' }));

// Middleware to serve static files from the specified directory
app.use(express.static(`${__dirname}/public`));

// Middleware to sanitize user input against NoSQL query injection
app.use(mongoSanitize());

// Middleware to sanitize user input against cross-site scripting (XSS) attacks
app.use(xss());

// Custom middleware function to add a property 'requestTime' to the request object
app.use((req, res, next) => {
  // Add a property 'requestTime' to the request object with the current timestamp
  req.requestTime = new Date().toISOString();
  // Call next() to pass control to the next middleware function
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
