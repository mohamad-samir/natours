const { promisify } = require('util'); // Import jwt for token creation
const jwt = require('jsonwebtoken'); // Import jwt for token creation
const User = require('./../models/userModel'); // Import User model
const catchAsync = require('./../utils/catchAsync'); // Import asynchronous error handling utility
const AppError = require('./../utils/appError'); // Import custom error handling utility

const signToken = id => {
  // Function to sign the JWT token
  return jwt.sign(
    {
      id // Embed user ID in JWT
    },
    process.env.JWT_SECRET, // Secret key for JWT
    { expiresIn: process.env.JWT_EXPIRES_IN } // Token expiration from environment variables
  );
};
exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    // Create new user in database
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  const token = signToken(newUser._id); // Generate token for new user
  res.status(201).json({
    status: 'success',
    token,
    data: { user: newUser } // Send new user data
  });
});

exports.login = catchAsync(async (req, res, next) => {
  // Check if email and password are provided
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError('please enter email and password', 400)); // Error if not provided
  // Look for user with provided email
  const user = await User.findOne({ email }).select('+password');

  // If user not found or password does not match
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401)); // Return error
  }

  const token = signToken(user._id); // Generate token for the user

  res.status(200).json({ status: 'success', token });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // Check if authorization header is present and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extract the token part after 'Bearer'
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token found, throw an authorization error
  if (!token) next(new AppError('You are not logged in', 401));

  // Decode the token to get user data
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Fetch the user based on the ID from the decoded token
  const currentUser = await User.findById(decoded.id);
  // Check if user no longer exists
  if (!currentUser) {
    return new AppError('User belong to this token doesnt exist', 401);
  }

  // Check if the user has changed their password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return new AppError('user recently changed password', 401);
  }

  // Assign user data to the request object
  req.user = currentUser;

  // Continue to the next middleware
  next();
});
