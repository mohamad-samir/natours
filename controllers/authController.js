const crypto = require('crypto');
const { promisify } = require('util'); // Import jwt for token creation
const jwt = require('jsonwebtoken'); // Import jwt for token creation
const User = require('./../models/userModel'); // Import User model
const catchAsync = require('./../utils/catchAsync'); // Import asynchronous error handling utility
const AppError = require('./../utils/appError'); // Import custom error handling utility
const sendEmail = require('./../utils/email'); // Import email utility

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

const createSendToken = (user, statusCode, res) => {
  // Generate a new JWT token for the user
  const token = signToken(user._id);

  // Configure cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true // Ensures the cookie cannot be accessed via client-side scripts
  };

  // Set 'secure' flag for cookies in production environment
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true; // Ensures the cookie is only sent over HTTPS in production
  }

  // Set a cookie named 'jwt' with the generated JWT token
  res.cookie('jwt', token, cookieOptions);

  // Remove the user's password from the response data for security reasons
  user.password = undefined;

  // Send a success response to the client with the new token and user data
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user }
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    // Create new user in database
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role
  });

  createSendToken(newUser, 201, res);
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

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true // Ensures the cookie cannot be accessed via client-side scripts
  });
  res.status(200).json({
    status: 'success'
  });
};

// Middleware to protect routes and ensure the user is authenticated
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1. Check if the authorization header contains a token and if it starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extract the token from the authorization header
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token)
    // 2. If no token is found, return an error indicating the user is not logged in
    return next(new AppError('You are not logged in', 401));

  // 3. Verify the token using the JWT secret
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 4. Find the user associated with the decoded token ID
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('User belonging to this token does not exist', 401)
    );
  }

  // 5. Check if the user changed their password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log in again.', 401)
    );
  }

  // 6. Attach the current user to the request object
  req.user = currentUser;
  res.locals.user = currentUser;

  // 7. Call the next middleware in the stack
  next();
});

// Middleware function to check if a user is logged in
exports.isLoggedIn = async (req, res, next) => {
  // Check if there is a JWT stored in the request cookies
  if (req.cookies.jwt) {
    try {
      // 1) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        // If user doesn't exist, proceed to the next middleware
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        // If user changed password, proceed to the next middleware
        return next();
      }

      // THERE IS A LOGGED IN USER
      // Attach user object to response locals
      res.locals.user = currentUser;

      // Proceed to the next middleware
      return next();
    } catch (err) {
      // If any errors occur during token verification, proceed to the next middleware
      return next();
    }
  }
  // If no JWT in cookies, proceed to the next middleware
  next();
};

// Middleware to restrict access based on user roles
exports.restrictTo = (...roles) => {
  // Return a middleware function
  return (req, res, next) => {
    // Check if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role)) {
      // If the user's role is not allowed, create an AppError with a 403 status code
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    // If the user's role is allowed, proceed to the next middleware
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Find the user using the email address provided in the request
  const user = await User.findOne({ email: req.body.email });
  // If user is not found, return a 404 error
  if (!user) return next(new AppError('no user found for this email', 404));

  // Create a password reset token for the user
  const resetToken = user.createPasswordResetToken();

  // Save the user with the updated PasswordResetToken and passwordResetExpires fields
  await user.save({ validateBeforeSave: false });

  // Create a URL address for resetting the password using the generated token
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  // Email message containing the reset password URL
  const message = `forgot your password submit a patch request with your 
  new password and password confirm to ${resetURL}.\n if you didnt forget 
  your password please ignore this email`;

  try {
    // Send the email to the user's email address
    await sendEmail({
      email: user.email,
      subject: 'your password reset token (valid for 10 min)',
      message
    });

    // Successful response with message sent to the user's email
    res.status(200).json({
      status: 'success',
      message: 'token sent to email'
    });
  } catch (err) {
    // If sending the email fails, remove the token and expiry date
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Return a 500 error if email sending fails
    return next(new AppError('error sending email', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Hash the token parameter received in the request URL using the SHA-256 algorithm
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  // Find a user in the database based on the hashed token and ensure that the token hasn't expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // Handle case where no user is found or the token has expired
  if (!user) return next(new AppError('invalid token or expired', 400));

  // Update the user's password with the new password provided in the request body
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined; // Clear the password reset token
  user.passwordResetExpires = undefined; // Clear the password reset expiry date

  // Save the updated user object in the database
  await user.save();

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // req.user = currentUser; from protect function

  // 2) Check if POSTed current password (passwordCurrent) is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
