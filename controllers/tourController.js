const Tour = require('./../models/tourModel');
//const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
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

// The getToursWithin function to get tours within a certain radius
exports.getToursWithin = catchAsync(async (req, res, next) => {
  // Extract distance, coordinates, and unit from request parameters
  const { distance, latlng, unit } = req.params;

  // Split the coordinates into latitude and longitude
  const [lat, lng] = latlng.split(',');

  // If latitude or longitude is not provided, return an error
  if (!lat || !lng) {
    return next(new AppError('Latitude and longitude must be provided', 400));
  }

  // Convert distance to radius in radians based on the unit
  // If unit is 'mi' (miles), divide by Earth's radius in miles (3963.2)
  // If unit is 'km' (kilometers), divide by Earth's radius in kilometers (6378.1)
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // Find tours within the specified radius using a geo query
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });
  /**Geospatial queries can be resource-intensive, especially for large datasets.
Properly indexing the geospatial field (using a 2dsphere index) is crucial for efficient queries. */

  // Send the result as a JSON response
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { data: tours }
  });
});

/**startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }:
This is the geospatial query condition. Here's what each part means:

startLocation: This is the field in the Tour schema that contains the geospatial data. 
It is assumed that this field contains data in a format that MongoDB can use for geospatial 
queries (such as GeoJSON).

$geoWithin: This is a MongoDB geospatial query operator. It selects documents with geospatial data 
that exists entirely within a specified shape. In this case, the shape is a sphere.

$centerSphere: [[lng, lat], radius]: This defines the spherical shape for the $geoWithin operator.
It specifies a circle for a sphere query. Here's the breakdown:

[lng, lat]: This is the center point of the sphere, specified as longitude and latitude.
radius: This is the radius of the sphere. The radius is specified in radians.
To convert a distance in miles or kilometers to radians, you divide the distance by 
the Earth's radius in those units (3963.2 for miles or 6378.1 for kilometers). */

/*
 * The getDistances function is designed to calculate distances
 * between a given point and the locations of documents in the Tour collection.
 * The distance calculated by the $geoNear stage are not stored in the database.
 * They are dynamically calculated for each query based on the provided coordinates
 * and returned in the response. This ensures that the distance information is always
 * accurate and up-to-date.
 */
exports.getDistances = catchAsync(async (req, res, next) => {
  // Extract coordinates, and unit from request parameters
  const { latlng, unit } = req.params;

  // Split the coordinates into latitude and longitude
  const [lat, lng] = latlng.split(',');

  // If latitude or longitude is not provided, return an error
  if (!lat || !lng) {
    return next(new AppError('Latitude and longitude must be provided', 400));
  }

  // Define the distance multiplier to convert distances from meters to miles or kilometers
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001; // miles or kilometers

  // Perform the aggregation query using the $geoNear stage
  const distances = await Tour.aggregate([
    {
      // $geoNear stage calculates distances from the given point to the documents' locations
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)] // Center point for the distance calculations
        },
        distanceField: 'distance', // The calculated distance will be stored in this field
        distanceMultiplier: multiplier, // Convert the distance to the desired unit
        spherical: true // Use spherical calculations
      }
    },
    {
      // Optional: Project the fields to return in the result
      $project: {
        distance: 1, // Include the distance field
        name: 1 // Include the name field of the tour
      }
    }
  ]);

  // Send the result as a JSON response
  res.status(200).json({
    status: 'success',
    data: { data: distances }
  });
  /*{
    "status": "success",
    "data": {
        "data": [
            {
                "_id": "5c88fa8cf4afda39709c2966",
                "name": "The Sports Lover",
                "distance": 40.208593926228964
            },....
*/
});
