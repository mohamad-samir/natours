const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError'); // Import custom error handling utility
const factory = require('./handlerFactory');

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
