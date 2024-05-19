const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// Define and export the getAllReviews function using catchAsync to handle errors
exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};

  // If the request contains a tourId parameter, add it to the filter object
  if (req.params.tourId) filter = { tour: req.params.tourId };

  // Fetch all review documents from the database, optionally filtered by tourId
  const reviews = await Review.find(filter);

  // Send a JSON response with the fetched reviews
  res.status(200).json({
    status: 'success', // Indicate that the request was successful
    results: reviews.length, // Include the number of reviews fetched
    data: { reviews } // Include the fetched reviews in the response data
  });
});

exports.setTourUserIds = (req, res, next) => {
  // If the request body does not have a 'tour' field,
  // set it to the 'tourId' parameter from the URL
  if (!req.body.tour) req.body.tour = req.params.tourId;

  // set the user field from the authenticated user's ID
  if (!req.body.user) req.body.user = req.user.id;
};

exports.createReview = factory.createOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
