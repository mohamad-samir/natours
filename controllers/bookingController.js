// Load the Stripe module and initialize it with the secret key from environment variables.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Import the Tour model from the models directory to fetch tour details from the database.
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync'); // Import a utility function to catch errors in async functions.
const AppError = require('../utils/appError'); // Import a custom error handling class.
const factory = require('./handlerFactory'); // Import a set of handler functions for general CRUD operations.

// Function to create a Stripe checkout session
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour by its ID
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) {
    return next(new AppError('No tour found with that ID', 404)); // If no tour is found, send a 404 error.
  }
  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    //Specify accepted payment methods (e.g., 'card', 'fpx', 'bacs_debit')
    payment_method_types: ['card'], // Allow card payments only.

    mode: 'payment', // Ensure that the session is in payment mode.
    // URL to redirect to after successful payment.
    //The (?) in (?tour=) indicates that the parameters will be appended to the URL as key-value pairs.
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,

    // URL to redirect to if payment is canceled.
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,

    customer_email: req.user.email, // Email of the customer making the payment.
    //req.user in protect middleware when the user authenticated become available in getCheckoutSession middleware,
    //allowing access to the authenticated user's details (such as email) to create a Stripe checkout session.
    client_reference_id: req.params.tourId, // Reference to the tour being booked.
    line_items: [
      {
        price_data: {
          currency: 'usd', // Currency in USD.
          unit_amount: tour.price * 100, // Price in cents (Stripe requires amounts to be in smallest currency unit).
          product_data: {
            name: `${tour.name} Tour`, // Name of the tour.
            description: tour.summary, // Description of the tour.
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`], // Image of the tour.
          },
        },
        quantity: 1, // Quantity of the product being purchased (always 1 in this case).
      },
    ],
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success', // Status of the request.
    session, // The session object created by Stripe.
  });
});

/// Function to handle booking creation after checkout session
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
  const { tour, user, price } = req.query; // Extract tour, user, and price from query parameters.

  if (!tour && !user && !price) return next(); // should be if (!tour || !user || !price) return next();
  await Booking.create({ tour, user, price }); // Create a new booking in the database with the extracted parameters.

  res.redirect(req.originalUrl.split('?')[0]); // Redirect to the original URL without query parameters.
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

/**Combined with AND (&&):
Example with || (hypothetical alternative):
javascriptCopyexports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, user, price } = req.query;

  if (!tour || !user || !price) return next();

  // This code runs only if ALL parameters are present
  await Booking.create({ tour, user, price });
  res.redirect(req.originalUrl.split('?')[0]);
});
In this case:

If tour = "123", user = "456", price = "100" → next() is called, no booking created
If tour = "123", user = "456", price = undefined → next() is called, no booking created
If tour = undefined, user = undefined, price = undefined → next() is called, no booking created

The key difference:

With &&, the booking is created unless ALL parameters are missing.
With ||, the booking is NOT created if ANY parameter is missing.

The && version is more permissive in creating bookings, while the || version is more restrictive. 
The current implementation with && allows for more flexibility, potentially creating bookings 
even if some non-critical information is missing. However, it's important to note that this flexibility 
should be balanced with proper validation elsewhere in the code to ensure data integrity.
*/

/**
 * Improved Approach
To enhance security, you might want to ensure that the user is authenticated before creating a booking. 
Here's how you could adjust the middleware sequence to include an authentication check:

router.get(
  '/',
  authController.isLoggedIn, // Ensure the user is authenticated first.
  bookingController.createBookingCheckout, // Then handle the booking creation.
  viewsController.getOverview // Finally, render the overview page.
);
And update the createBookingCheckout to validate the authenticated user:

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const { tour, price } = req.query; // Extract tour and price from query parameters.
  const user = req.user.id; // Use authenticated user's ID.

  if (!tour || !user || !price) return next(); // Ensure all parameters are present.
  await Booking.create({ tour, user, price }); // Create a new booking in the database.

  res.redirect(req.originalUrl.split('?')[0]); // Redirect to the original URL without query parameters.
});

Summary
While the initial approach assumes the security of the post-payment flow, enhancing it with authentication 
checks can prevent unauthorized bookings and improve overall security. By requiring the user to be authenticated 
before booking creation, you ensure that only legitimate users can complete the booking process.
 */
