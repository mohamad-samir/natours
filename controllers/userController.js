const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError'); // Import custom error handling utility

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

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordCurrent)
    return next(new AppError('wrong route please use /updateMyPassword', 400));

  const filteredBody = filterObj(req.body, 'name', 'email');

  // Find and update the user document based on the provided ID
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });
  // Check if no user document was found
  if (!updatedUser) {
    return next(new AppError('User not found', 404));
  }

  // Send success response with updated user data
  res.status(200).json({
    status: 'success',
    user: updatedUser
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({ status: 'success', data: null });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
