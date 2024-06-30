const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// Define the schema for the User model
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'], // Validation to ensure name is provided
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'], // Validation to ensure email is provided
    unique: true, // Making sure the email is unique in the database
    lowercase: true, // Convert email to lowercase before saving
    validate: [validator.isEmail, 'Please provide a valid email'], // Validate email format
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'], // Validation for password
    minlength: 8, // Minimum length of 8 characters for the password
    select: false, // Do not return the password by default when querying
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'], // Confirm password is required
    validator: {
      // Validator to ensure password and confirm password are the same
      validate: function (el) {
        return el === this.password;
      },
      message: 'different passwords', // Error message if passwords are different
    },
  },
  passwordChangedAt: Date, // Stores the time when the password was last changed

  passwordResetToken: String,
  passwordResetExpires: Date,
  active: { type: Boolean, default: true, select: false },
});

// Middleware to hash the password before saving the user document
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Only hash the password if it has been modified

  this.password = await bcrypt.hash(this.password, 12); // Hash the password with a cost of 12
  this.passwordConfirm = undefined; // Remove password confirm field
  next();
});

userSchema.pre('save', function (next) {
  // If the password has not been modified or the document is new, move to the next middleware
  if (!this.isModified('password') || this.isNew) return next();

  // Set the passwordChangedAt field to the current date and time
  this.passwordChangedAt = Date.now() - 1000; //to ensure that token made after password changed

  // Move to the next middleware
  next();
});

userSchema.pre(/^find/, function (next) {
  // Modify the query to include only active users
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPsaaword,
) {
  // Compare the candidate password (plain text) with the hashed user password
  // bcrypt.compare() is an asynchronous function that returns a Promise,
  // which resolves to true if the passwords match, and false otherwise.
  return await bcrypt.compare(candidatePassword, userPsaaword);
};

// Check if password was changed after the JWT token was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  // Check if the passwordChangedAt field exists and if it does, proceed with the comparison
  if (this.passwordChangedAt) {
    // Convert the passwordChangedAt timestamp to seconds (UNIX timestamp)
    const changedTimestamp = parseInt(this.passwordChangedAt / 1000, 10);

    // Compare the JWT token timestamp with the passwordChangedAt timestamp
    return JWTTimestamp < changedTimestamp; // If the JWT token was issued before the password was last changed, return true
  }

  // If the passwordChangedAt field doesn't exist, return false
  return false;
};

// Define a method on the user schema to generate a password reset token
userSchema.methods.createPasswordResetToken = function () {
  // Generate a random token using 32 random bytes and convert it to a hexadecimal string
  const resetToken = crypto.randomBytes(32).toString('hex');
  // Hash the reset token using the SHA-256 algorithm
  // and store the hashed token in the PasswordResetToken field of the user document
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set the expiration time for the password reset token to 10 minutes from the current time
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // Return the plain text reset token for sending to the user
  return resetToken;
};

const User = mongoose.model('User', userSchema); // Create the User model

module.exports = User; // Export the User model
