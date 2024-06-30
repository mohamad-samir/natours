const mongoose = require('mongoose');

// Define the schema for a Booking
const bookingSchema = new mongoose.Schema({
  // Tour and User References: The schema sets up references to Tour and User documents.
  // This creates relationships between documents, allowing for efficient data retrieval and organization.
  tour: {
    type: mongoose.Schema.ObjectId, // The tour field is a reference to a Tour document
    ref: 'Tour', // Reference the Tour model
    required: [true, 'Booking must belong to a Tour!'], // This field is required with a custom error message
  },
  user: {
    type: mongoose.Schema.ObjectId, // The user field is a reference to a User document
    ref: 'User', // Reference the User model
    required: [true, 'Booking must belong to a User!'], // This field is required with a custom error message
  },
  price: {
    type: Number, // The price of the booking
    required: [true, 'Booking must have a price.'], // This field is required with a custom error message
  },
  createdAt: {
    type: Date, // The date the booking was created
    default: Date.now(), // Default value is the current date and time
  },
  paid: {
    type: Boolean, // Whether the booking has been paid for
    default: true, // Default value is true
  },
});

//Automatic Population: The pre-hook middleware ensures that every time a find query is executed on
//the Booking model, the user and tour fields are automatically populated with their respective documents.
//This simplifies querying by automatically including related data.

// Middleware to populate the user and tour fields when a find query is executed
bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'tour', // Populate the tour field
    select: 'name', // Only select the name field from the Tour document
  });
  next(); // Call the next middleware
});

//Booking Model: The Booking model can now be used to create, read, update,
//and delete bookings in the MongoDB database, leveraging Mongoose's powerful
//features for schema definition and data validation.

// Create the Booking model from the schema
const Booking = mongoose.model('Booking', bookingSchema);

// Export the Booking model
module.exports = Booking;

//This setup ensures that booking data is well-structured, with clear references to users and tours,
//and facilitates easy retrieval of related data through automatic population.
