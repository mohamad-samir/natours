const Review = require('../models/reviewModel');
//const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getAllReviews = factory.getAll(Review);

exports.setTourUserIds = (req, res, next) => {
  // If the request body does not have a 'tour' field,
  // set it to the 'tourId' parameter from the URL
  if (!req.body.tour) req.body.tour = req.params.tourId;

  // set the user field from the authenticated user's ID
  if (!req.body.user) req.body.user = req.user.id;
  next(); // next() call in the setTourUserIds function,
  //  is necessary to pass control to the next middleware or route handler.
  /**router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds, (without next you will stuck here)
    reviewController.createReview
  ); */
};

exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
