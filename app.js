const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const app = express();

app.use(morgan('dev'));

app.use(express.json());
// 1) Middlewares
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

// 2) Route handlers
const getAllTours = (req, res) => {
  console.log(req.requestTime);

  res.status(200).json({
    status: 'success',
    requestedAT: req.requestTime,
    results: tours.length,
    data: { tours },
  });
};

const getTour = (req, res) => {
  const id = req.params.id * 1;
  const tour = tours.find((el) => el.id === id);

  //if (id > tours.length){
  if (!tour) {
    return res.status(404).json({
      status: 'failed',
      message: 'invalid ID',
    });
  }
  res.status(200).json({
    status: 'success',
    data: { tour },
  });
};

const cereateTour = (req, res) => {
  // console.log(req.body);
  const newId = tours[tours.length - 1].id + 1;

  //Object.assign(target, source1, ..., sourceN);
  //target: (Required) This is the object that will receive the copied properties.
  const newTour = Object.assign({ id: newId }, req.body);

  tours.push(newTour);
  fs.writeFile(
    `${__dirname}/dev-data/data/tours-simple.json`,

    JSON.stringify(tours),
    (err) => {
      res.status(201).json({
        status: 'success',
        data: { tour: newTour },
      });
    }
  );
};

const updateTour = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'failed',
      message: 'invalid ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour: '<Updated tour here...>',
    },
  });
};

const deleteTour = (req, res) => {
  if (req.params.id * 1 > tours.length) {
    return res.status(404).json({
      status: 'failed',
      message: 'invalid ID',
    });
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
};

const getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'not yet defined',
  });
};

const getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'not yet defined',
  });
};

const cereateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'not yet defined',
  });
};

const updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'not yet defined',
  });
};

const deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'not yet defined',
  });
};

// 3) Routes
app.route('/api/v1/tours/').get(getAllTours).post(cereateTour);

app
  .route('/api/v1/tours/:id?')
  .get(getTour)
  .patch(updateTour)
  .delete(deleteTour);

app.route('/api/v1/users/').get(getAllUsers).post(cereateUser);

app
  .route('/api/v1/users/:id?')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

// 4) Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`we are listining on port ${port}...`);
});
