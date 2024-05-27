const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');

const app = express();

// Set Pug as the view engine
app.set('view engine', 'pug');

// Set the directory for Pug templates
app.set('views', path.join(__dirname, 'views'));

// Middleware to serve static files from the specified directory
app.use(express.static(path.join(__dirname, 'public')));

// 1) GLOBAL MIDDLEWARES

// Apply helmet middleware for enhanced security by setting various HTTP headers
app.use(helmet());

// Apply morgan middleware for logging HTTP requests in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting middleware to limit the number of requests from a single IP address
const limiter = rateLimit({
  max: 100, // Maximum number of requests allowed from a single IP address
  windowMs: 60 * 60 * 1000, // Time window for limiting requests (in milliseconds)
  message: 'Too many requests from this IP, please try again in an hour!'
});

app.use('/api', limiter); // Apply rate limiting middleware to API routes

// Middleware to parse incoming requests with JSON payloads and limit the size of the payload
app.use(express.json({ limit: '10kb' }));

// Middleware to sanitize user input data to prevent NoSQL query injection
app.use(mongoSanitize());

// Middleware to sanitize user input data to prevent cross-site scripting (XSS) attacks
app.use(xss());

// Middleware to prevent HTTP Parameter Pollution (HPP) attacks by sanitizing query parameters
// Whitelisting specific parameters to allow duplicate values for them
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// Custom middleware function to add a 'requestTime' property to the request object
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); // Add the current timestamp
  next(); // Call next() to pass control to the next middleware function
});

// 3) ROUTES

// Define a route to render the 'base' Pug template for the root URL
app.get('/', (req, res) => {
  res.status(200).render('base'); // Render the 'base' template from the 'views' directory
});

// Mounting the tour, user, and review routers to their respective routes
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// Middleware to handle all undefined routes (404 errors)
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404)); // Pass a new AppError to the global error handler
});

// Global error handling middleware
app.use(globalErrorHandler);

// Export the Express app
module.exports = app;
