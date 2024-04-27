const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// Define the schema for the User model
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'] // Validation to ensure name is provided
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'], // Validation to ensure email is provided
    unique: true, // Making sure the email is unique in the database
    lowercase: true, // Convert email to lowercase before saving
    validate: [validator.isEmail, 'Please provide a valid email'] // Validate email format
  },
  photo: {
    type: String // Optional field for user photo
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'], // Validation for password
    minlength: 8, // Minimum length of 8 characters for the password
    select: false // Do not return the password by default when querying
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'], // Confirm password is required
    validator: {
      // Validator to ensure password and confirm password are the same
      validate: function(el) {
        return el === this.password;
      },
      message: 'different passwords' // Error message if passwords are different
    }
  },
  passwordChangedAt: Date, // Stores the time when the password was last changed

  passwordResetToken: String,
  passwordResetExpires: Date
});

// Middleware to hash the password before saving the user document
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next(); // Only hash the password if it has been modified

  this.password = await bcrypt.hash(this.password, 12); // Hash the password with a cost of 12
  this.passwordConfirm = undefined; // Remove password confirm field
  next();
});

// Method to compare candidate password with user's password
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPsaaword
) {
  return await bcrypt.compare(candidatePassword, userPsaaword);
};

// Check if password was changed after the JWT token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt / 1000, 10); // Convert to timestamp
    return JWTTimestamp < changedTimestamp; // Compare timestamps
  }
  return false;
};

// Define a method on the user schema to generate a password reset token
userSchema.methods.createPasswordResetToken = function() {
  // Generate a random token using 32 random bytes and convert it to a hexadecimal string
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash the reset token using the SHA-256 algorithm
  // and store the hashed token in the PasswordResetToken field of the user document
  this.PasswordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set the expiration time for the password reset token to 10 minutes from the current time
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // Return the plain text reset token for sending to the user
  return resetToken;
};

//userSchema.index({ email: 1 }, { unique: true }); // Define the unique index
const User = mongoose.model('User', userSchema); // Create the User model

module.exports = User; // Export the User model
