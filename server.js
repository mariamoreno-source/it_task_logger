const express = require('express');
const { body, validationResult } = require('express-validator');
const mysql = require('mysql');

const app = express();
//to handle form requests
app.use(
  express.urlencoded({
    extended: true,
  })
);

const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'Moreno1@',
  database: 'tech4513',
});

db.connect();

// homepage
app.get('/', (req, res) => {
  res.sendFile(__dirname + '\\client\\index.html');
});

// register page
app.post(
  '/register',
  // validate registration form using express-validator
  body('Client').toBoolean(),
  body('FirstName').isLength({ min: 3 }),
  body('LastName').isLength({ min: 3 }),
  body('Password').isAlpha().isNumeric().isLength({ min: 6 }),
  (req, res) => {
    const errors = validationResult(req);
    // if errors is NOT empty - respond 400 status
    if (!errors.isEmpty) {
      res.status(400).json({ msg: errors.array() });
    }

    // Pull variables from req.body
    const { FirstName, LastName, Password, Client } = req.body;
    // Insert Statement
    const sql = `INSERT INTO user (Password, FirstName, LastName, Client) VALUES ('${Password}', '${FirstName}', '${LastName}', ${Client});`;

    // Inserting into SQL database
    db.query(sql, (err, result) => {
      if (err) throw err;

      res.status(201).json({ result: 'Successfully created' });
    });
  }
);

app.post('/register', (req, res) => {
  console.log(req.body);
});

// Get technician
app.get('/users', (req, res) => {
  const sql = 'SELECT FirstName, LastName FROM user';

  db.query(sql, (err, result) => {
    if (err) throw err;

    res.send(result);
  });
});

// server startr
app.listen(7000, (err) => {
  if (err) throw err;

  console.log('\nServer has started on port 7000');
});
