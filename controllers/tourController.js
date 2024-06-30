const multer = require('multer'); // Importing Multer for handling file uploads
const sharp = require('sharp');

const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// Using Multer memory storage to store files as buffers in memory req.file.buffer
const multerStorage = multer.memoryStorage();

// Function to filter uploaded files based on mime type
// This function ensures that only image files are accepted for upload
const multerFilter = (req, file, cb) => {
  // Check if the mime type starts with 'image'
  if (file.mimetype.startsWith('image')) {
    cb(null, true); // If it's an image, accept the file
  } else {
    // If it's not an image, return an error and reject the file
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

// Create an instance of Multer with the specified storage configuration and optional settings
const upload = multer({
  storage: multerStorage, // Set the storage configuration defined above to store files as buffers in memory req.file.buffer
  fileFilter: multerFilter, // Optionally, add a file filter for validation
  // limits: { fileSize: 1024 * 1024 * 5 }   // Optionally, set file size limits (e.g., 5MB limit)
});

// Configures multer to accept multiple fields with specified names and maximum file counts.
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);
// upload.single('image')  - req.file
// upload.array('Images',5) - req.files

// req.files will now contain:
// {
//   imageCover: [{ ...fileData }],
//   images: [{ ...fileData }, { ...fileData }, { ...fileData }]
// }

/**
req.files = {
  imageCover: [
    {
      fieldname: 'imageCover',
      originalname: 'cover-photo.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: <Buffer 89 50 4e 47 0d 0a 1a 0a ... >, // The raw file data
      size: 1024000 // Size of the file in bytes
    }
  ],

  images: [
            { ...fileData }, { ...fileData }, { ...fileData }  
          ]
};
 */

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // Check if either imageCover or images are not present in the request, then proceed to the next middleware
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Processing the Cover Image
  // Generate a unique filename for the cover image using tour ID and current timestamp
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  // Use sharp to process the cover image
  await sharp(req.files.imageCover[0].buffer) // Access the buffer of the cover image file
    /**imageCover: This is the name of the field in the form that holds the cover image. 
     *             req.files.imageCover is an array containing the uploaded files for this field.
              [0]: Since imageCover can only contain one file (as specified by maxCount: 1 in multer configuration),
                   we access the first and only element of the array.
 */
    .resize(2000, 1333) // Resize the image to 2000x1333 pixels
    .toFormat('jpeg') // Convert the image format to JPEG
    .jpeg({ quality: 90 }) // Set JPEG quality to 90
    .toFile(`public/img/tours/${req.body.imageCover}`); // Save the processed image to the specified path
  // The .toFile method in sharp requires a full file path, including the filename

  // 2) Processing the Additional Images
  // Initialize an empty array to store filenames of the processed images
  req.body.images = [];

  // Use Promise.all to process all additional images concurrently
  await Promise.all(
    req.files.images.map(async (file, i) => {
      // Map through each image file
      // Generate a unique filename for each image using tour ID, current timestamp, and the index
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      // Use sharp to process the image
      await sharp(file.buffer) // Access the buffer of the image file
        .resize(2000, 1333) // Resize the image to 2000x1333 pixels
        .toFormat('jpeg') // Convert the image format to JPEG
        .jpeg({ quality: 90 }) // Set JPEG quality to 90
        .toFile(`public/img/tours/${filename}`); // Save the processed image to the specified path

      // Push the filename of the processed image into req.body.images array
      req.body.images.push(filename);
    }),
  );

  // Call next() to proceed to the next middleware after all images are processed successfully
  next();
});

/*
In this case, req.body.imageCover and req.body.images are populated with filenames of the processed images
in req.body which is used to store data that will be passed to the next middleware or route handler. 
This allows the next middleware or route handler to access the processed image filenames and perform 
further operations, such as saving the filenames to a database. */

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
      $match: { ratingsAverage: { $gte: 4.5 } }, // Match tours with ratingsAverage >= 4.5
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' }, // Group by the difficulty field, converting it to uppercase
        numTours: { $sum: 1 }, // Count the number of tours
        numRatings: { $sum: '$ratingsQuantity' }, // Sum the ratingsQuantity field
        avgRating: { $avg: '$ratingsAverage' }, // Calculate the average of ratingsAverage
        avgPrice: { $avg: '$price' }, // Calculate the average of price
        minPrice: { $min: '$price' }, // Find the minimum price
        maxPrice: { $max: '$price' }, // Find the maximum price
      },
    },
    {
      $sort: { avgPrice: 1 }, // Sort the results by avgPrice in ascending order
    },
    // Uncomment the following block if you want to exclude 'EASY' difficulty from the results
    // {
    //   $match: { _id: { $ne: 'EASY' } }
    // }
  ]);

  // Send the response with the calculated statistics
  res.status(200).json({
    status: 'success', // Indicate that the request was successful
    data: {
      stats, // Include the stats data in the response
    },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
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
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  /**Geospatial queries can be resource-intensive, especially for large datasets.
Properly indexing the geospatial field (using a 2dsphere index) is crucial for efficient queries. */

  // Send the result as a JSON response
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { data: tours },
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
          coordinates: [parseFloat(lng), parseFloat(lat)], // Center point for the distance calculations
        },
        distanceField: 'distance', // The calculated distance will be stored in this field
        distanceMultiplier: multiplier, // Convert the distance to the desired unit
        spherical: true, // Use spherical calculations
      },
    },
    {
      // Optional: Project the fields to return in the result
      $project: {
        distance: 1, // Include the distance field
        name: 1, // Include the name field of the tour
      },
    },
  ]);

  // Send the result as a JSON response
  res.status(200).json({
    status: 'success',
    data: { data: distances },
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
