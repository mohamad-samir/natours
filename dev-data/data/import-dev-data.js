// Import required modules
const fs = require('fs'); // File system module for reading files
const mongoose = require('mongoose'); // Mongoose for MongoDB connection and schema management
const dotenv = require('dotenv'); // Dotenv for loading environment variables from a config file

// Import models
const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

// Load environment variables from config.env file
dotenv.config({ path: './config.env' });

// Replace <PASSWORD> in the DATABASE URL with the actual database password from environment variables
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// Connect to the MongoDB database using Mongoose
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DB connection successful!'));

// Read JSON files containing data
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

// Function to import data into the database
const importData = async () => {
  try {
    await Tour.create(tours); // Create tours in the database
    await User.create(users, { validateBeforeSave: false }); // Create users in the database, skip validation
    await Review.create(reviews); // Create reviews in the database
    console.log('Data successfully loaded!');
  } catch (err) {
    console.log(err);
  }
  process.exit(); // Exit the process
};

// Function to delete all data from the database
const deleteData = async () => {
  try {
    await Tour.deleteMany(); // Delete all tours
    await User.deleteMany(); // Delete all users
    await Review.deleteMany(); // Delete all reviews
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit(); // Exit the process
};

// Command-line interface logic to determine whether to import or delete data
if (process.argv[2] === '--import') {
  importData(); // Import data if the script is run with the '--import' argument
} else if (process.argv[2] === '--delete') {
  deleteData(); // Delete data if the script is run with the '--delete' argument
}
