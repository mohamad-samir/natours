const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError'); // Import custom error handling utility

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  // Send an HTTP response with status 200 and render the 'overview' template with dynamic data
  res.status(200).render('overview', { title: 'All Tours', tours });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  });

  if (!tour) return next(new AppError('There is no tour with that name', 404));
  // Send an HTTP response with status 200 and render the 'tour' template with dynamic data
  res.status(200).render('tour', { title: `${tour.name} Tour`, tour });
});

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', { title: 'log in to your account' });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', { title: 'Your account' });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    { new: true, runValidators: true },
  );
  res
    .status(200)
    .render('account', { title: 'Your account', user: updatedUser });
});

// Define an asynchronous function to handle fetching user's booked tours and rendering them
exports.getMyTours = catchAsync(async (req, res, next) => {
  // Retrieve bookings associated with the current user from the database
  const booking = await Booking.find({ user: req.user.id });

  // Extract an array of tour IDs from the bookings retrieved
  const tourIDs = booking.map((el) => el.tour);

  // Retrieve all tours that match the IDs extracted from tourIDs
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  // Respond with a status code of 200 (OK) and render the 'overview' template
  // Provide the title 'My Tours' and the retrieved tours array to the template for rendering
  res.status(200).render('overview', { title: 'My Tours', tours });
});
