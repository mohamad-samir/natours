const fs = require('fs');

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

exports.getAllTours = (req, res) => {
  console.log(req.requestTime);

  res.status(200).json({
    status: 'success',
    requestedAT: req.requestTime,
    results: tours.length,
    data: { tours },
  });
};

exports.getTour = (req, res) => {
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

exports.cereateTour = (req, res) => {
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

exports.updateTour = (req, res) => {
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

exports.deleteTour = (req, res) => {
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
