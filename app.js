const fs = require('fs');
const express = require('express');

const app = express();

app.use(express.json());
/* app.get('/', (req, res) => {
  res.status(200).json({ message: 'hellow from server side', app: 'Natours' });
});

app.post('/', (req, res) => {
  res.send('you can post on this endpoint');
}); */
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

app.get('/api/v1/tours', (req, res) => {
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: { tours },
  });
});

app.get('/api/v1/tours/:id', (req, res) => {
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
});

app.post('/api/v1/tours', (req, res) => {
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
});

const port = 3000;

app.listen(port, () => {
  console.log(`we are listining on port ${port}...`);
});
