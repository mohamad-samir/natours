const multer = require('multer'); // Importing Multer for handling file uploads
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError'); // Import custom error handling utility
const factory = require('./handlerFactory');

// Setting up Multer disk storage configuration
const multerStorage = multer.diskStorage({
  // Configuring the destination function to specify the folder where uploaded files will be stored
  destination: function(req, file, cb) {
    // Call the callback function with null as the first argument (indicating no error)
    // and the destination folder path as the second argument
    cb(null, '/public/img/users'); // Files will be stored in the '/public/img/users' directory
  },

  // Configuring the filename function to determine the name of the uploaded file
  filename: function(req, file, cb) {
    // Extracting the file extension from the mime type of the uploaded file
    // The mime type is in the format 'type/subtype', for example, 'image/jpeg'
    // We split the mime type string by '/' and take the second part to get the extension
    const ext = file.mimetype.split('/')[1];

    // Constructing the filename using the user ID from the request object and the current timestamp
    // Filename is in the format 'user-{userID}-{currentTimestamp}.{extension}', for example, 'user-123456-1623364800000.jpg'
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  }
});

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

// Example of how to use this storage configuration with Multer
// Create an instance of Multer with the specified storage configuration and optional settings
const upload = multer({
  storage: multerStorage, // Set the storage configuration defined above
  // Optionally, add a file filter for validation
  fileFilter: multerFilter
  // Optionally, set file size limits (e.g., 5MB limit)
  // limits: { fileSize: 1024 * 1024 * 5 }
});

// Middleware to handle single file upload with the field name 'photo'
exports.uploadUserPhoto = upload.single('photo');

// Function to filter object properties based on allowed fields
const filterObj = (obj, ...allowedFields) => {
  // Create a new empty object to store filtered properties
  const newObj = {};

  // Loop through each property in the original object
  Object.keys(obj).forEach(el => {
    // Check if the property is included in the allowed fields
    if (allowedFields.includes(el)) {
      // If included, add the property to the new object
      newObj[el] = obj[el];
    }
  });

  // Return the new object with filtered properties
  return newObj;
};

exports.getMe = (req, res, next) => {
  // Set the ID parameter of the request to the authenticated user's ID
  req.params.id = req.user.id;
  next();
};

exports.getAllUsers = factory.getAll(User);

// Define and export the updateMe function using catchAsync to handle errors
exports.updateMe = catchAsync(async (req, res, next) => {
  // Check if the request body contains password fields
  if (req.body.password || req.body.passwordCurrent) {
    return next(
      new AppError(
        'Wrong route! Please use /updateMyPassword for password updates.',
        400
      )
    );
  }

  // Filter the request body to only include 'name' and 'email' fields
  const filteredBody = filterObj(req.body, 'name', 'email');
  // Assuming req.file is populated by multer or similar middleware
  // If a file is present in the request, assign its filename to the 'photo' property of filteredBody
  if (req.file) filteredBody.photo = req.file.filename;

  // Find the user by ID and update with the filtered data
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // Return the updated user document , not the original document before the update.
    runValidators: true // Run validators on the updated fields
  });
  /*When using findByIdAndUpdate, the default behavior is to return the document 
  as it was before the update. To return the modified document instead, you use 
  the new: true option. */

  // If no user is found, return a 404 error
  if (!updatedUser) {
    return next(new AppError('User not found', 404));
  }

  // Send a JSON response with the updated user data
  res.status(200).json({
    status: 'success', // Indicate that the update was successful
    data: { user: updatedUser } // Include the updated user in the response data
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  /**This part uses User.findByIdAndUpdate to find the user
   * by their ID (req.user.id) and updates their active field to false.
   * This approach marks the user as inactive instead of deleting the
   * user from the database, which is a soft delete method. */

  res.status(204).json({ status: 'success', data: null });
});

exports.getUser = factory.getOne(User);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};

//Dont update password with this
exports.updateUser = factory.updateOne(User);
/**The save middleware is only called when using methods like
 * save or create.
 * findByIdAndUpdate and other update methods
 * bypass this middleware, leading to potential security risks. */

exports.deleteUser = factory.deleteOne(User);
