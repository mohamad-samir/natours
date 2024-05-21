const Tour = require('./../models/tourModel');
//const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
//const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// });

// Define and export the getTourStats function using catchAsync to handle errors
exports.getTourStats = catchAsync(async (req, res, next) => {
  // Perform the aggregation on the Tour model
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } } // Match tours with ratingsAverage >= 4.5
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // Group by the difficulty field, converting it to uppercase
        numTours: { $sum: 1 }, // Count the number of tours
        numRatings: { $sum: '$ratingsQuantity' }, // Sum the ratingsQuantity field
        avgRating: { $avg: '$ratingsAverage' }, // Calculate the average of ratingsAverage
        avgPrice: { $avg: '$price' }, // Calculate the average of price
        minPrice: { $min: '$price' }, // Find the minimum price
        maxPrice: { $max: '$price' } // Find the maximum price
      }
    },
    {
      $sort: { avgPrice: 1 } // Sort the results by avgPrice in ascending order
    }
    // Uncomment the following block if you want to exclude 'EASY' difficulty from the results
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  // Send the response with the calculated statistics
  res.status(200).json({
    status: 'success', // Indicate that the request was successful
    data: {
      stats // Include the stats data in the response
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});
