const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.status(200).json({ message: 'hellow from server side', app: 'Natours' });
});

app.post('/', (req, res) => {
  res.send('you can post on this endpoint');
});

const port = 3000;

app.listen(port, () => {
  console.log(`we are listining oon port ${port}...`);
});
