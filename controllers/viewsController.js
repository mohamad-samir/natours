const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  // Send an HTTP response with status 200 and render the 'overview' template with dynamic data
  res.status(200).render('overview', { title: 'All Tours', tours });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    select: 'review rating user'
  });

  // Send an HTTP response with status 200 and render the 'tour' template with dynamic data
  res.status(200).render('tour', { title: `${tour.name} Tour`, tour });
});
