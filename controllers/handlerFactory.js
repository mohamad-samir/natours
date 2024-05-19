const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

// The createOne function takes a Mongoose model as an argument
exports.createOne = Model =>
  // Returns an asynchronous middleware function
  catchAsync(async (req, res, next) => {
    // Use the model to create a new document with data from the request body
    const doc = await Model.create(req.body);

    // Respond with a 201 status code and a JSON object containing the created document
    res.status(201).json({
      status: 'success', // Indicating that the operation was successful
      data: {
        data: doc // The created document
      }
    });
  });
