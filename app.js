const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
//const { v4: uuidv4 } = require('uuid'); //generates a nonce value and attaches it to res.locals, making it available to the Pug template.
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// Set Pug as the template engine
app.set('view engine', 'pug');

// Define the directory for Pug templates
app.set('views', path.join(__dirname, 'views'));

// Middleware to serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// 1) GLOBAL MIDDLEWARES

// Middleware to add nonce to res.locals
app.use((req, res, next) => {
  res.locals.nonce = uuidv4();
  next();
});

// Use Helmet to set various HTTP headers for security
app.use(helmet());
//https://stackoverflow.com/questions/66650925/getting-error-message-while-try-to-load-mapbox
/*
const scriptSrcUrls = [
  'https://api.tiles.mapbox.com/',
  'https://api.mapbox.com/',
  'https://cdnjs.cloudflare.com',
  'https://js.stripe.com', // This allows loading of Stripe's JavaScript library (v3) which is essential for client-side integration with Stripe.
  'https://api.stripe.com', // This allows communication with Stripe's API endpoints, necessary for processing payments and other Stripe API functionalities.
  'https://js.stripe.com/v3/',
];

const styleSrcUrls = [
  'https://api.mapbox.com/',
  'https://api.tiles.mapbox.com/',
  'https://fonts.googleapis.com/',
];

const connectSrcUrls = [
  'https://api.mapbox.com/',
  'https://events.mapbox.com',
  'https://a.tiles.mapbox.com/',
  'https://b.tiles.mapbox.com/',
  'ws://127.0.0.1:*', // Allow WebSocket connections to any port on localhost
];

const fontSrcUrls = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://fonts.gstatic.com',
];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: (req, res) => [
        "'self'",
        ...scriptSrcUrls,
        `'nonce-${res.locals.nonce}'`,
      ], // Use the function to dynamically insert nonce
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: ["'none'"],
      imgSrc: ["'self'", 'blob:', 'data:'],
      fontSrc: ["'self'", ...fontSrcUrls, 'data:'], // Allow fonts from 'self', Google Fonts, and inline data if used
      frameAncestors: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: true, // Set to true instead of an empty array
      frameSrc: ["'self'", 'https://js.stripe.com'], // Allow frames from Stripe
    },
  }),
);
*/
// Use Morgan to log HTTP requests in development mode
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set up rate limiting to limit the number of requests from a single IP
const limiter = rateLimit({
  max: 100, // Maximum number of requests per windowMs
  windowMs: 60 * 60 * 1000, // Time window in milliseconds (1 hour)
  message: 'Too many requests from this IP, please try again in an hour!', // Message to send when rate limit is exceeded
});

// Apply the rate limiter to all API routes
app.use('/api', limiter);

// Middleware to parse JSON requests and limit the size to 10kb
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Middleware to sanitize data to prevent NoSQL injection attacks
app.use(mongoSanitize());

// Middleware to sanitize data to prevent XSS attacks
app.use(xss());

// Middleware to prevent HTTP parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// Use compression middleware to compress HTTP responses
app.use(compression());

// Custom middleware to add the current timestamp to the request object
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString(); // Add requestTime property to request object
  //console.log(req.cookies);

  next(); // Pass control to the next middleware function
});

// 3) ROUTES

/**
 * API Route: When making an API request to get a list of tours, the client might make a request to
 * http://yourdomain.com/api/v1/tours.
 * This request would be handled by tourRouter, which returns data in a format like JSON.
 * View Route: When a user wants to view a tour on the website, they might visit http://yourdomain.com/tour/slug.
 * This request would be handled by viewRouter, which renders an HTML page displaying the tour information.
 * api/v1 Prefix: Used for API routes to clearly separate backend API functionality and support versioning.
 * No Prefix for viewRouter: Used for serving web pages and user interfaces, resulting in cleaner, user-friendly URLs.
 */
// Mount routers for different resources
app.use('/', viewRouter); // Routes for rendering views
app.use('/api/v1/tours', tourRouter); // Routes for tour-related APIs
app.use('/api/v1/users', userRouter); // Routes for user-related APIs
app.use('/api/v1/reviews', reviewRouter); // Routes for review-related APIs
app.use('/api/v1/bookings', bookingRouter);

// Middleware to handle all undefined routes (404 errors)
app.all('*', (req, res, next) => {
  // Create a new AppError and pass it to the global error handler
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

// Export the Express app
module.exports = app;
