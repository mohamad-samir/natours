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
};

exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
