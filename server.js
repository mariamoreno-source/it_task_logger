const express = require('express');
const { body, validationResult } = require('express-validator');
const mysql = require('mysql');

const bcrypt = require('bcryptjs'); // For hashing password
const jwt = require('jsonwebtoken'); // For sending/decrypting tokens
const config = require('config'); // Config used to obtain JWT secret

const app = express();
//to handle json body requests
app.use(express.urlencoded({ extended: false }), express.json());

const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'Moreno1@',
  database: 'tech4513',
});

db.connect();

// homepage
app.get('/', (req, res) => {
  // __dirname is the current directory/file
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
  // asynchronous, awaiting hash for password
  async (req, res) => {
    const errors = validationResult(req);
    // if errors is NOT empty - respond 400 status
    if (!errors.isEmpty) {
      res.status(400).json({ msg: errors.array() });
    }

    // Pull variables from req.body
    let { FirstName, LastName, Password, Client } = req.body;

    try {
      // Check if already exists in DB before adding
      const sqlCheckUser = `SELECT * FROM tech4513.user WHERE FirstName = ?' and LastName = ?;`;

      db.query(sqlCheckUser, [FirstName, LastName], (err, res) => {
        if (err) {
          console.error('errors: ', err); // Print errors onto server console
          return res.send(500); // Ends this post request
        } else if (res.length) {
          // if res is not empty, then a user with first & last name exists
          console.log(
            'Failed creating user - user with that name already created'
          );
          // respond with status 400 (user request error) and description of error
          res
            .status(400)
            .json({ Error: 'User' + FirstName + LastName + ' already taken' });
        } else {
          // Encrypt the password
          const salt = await bcrypt.genSalt(10);
          Password = await bcrypt.hash(Password, salt);

          // Insert Statement
          const sql = `INSERT INTO user (Password, FirstName, LastName, Client) VALUES (?, ?, ?, ?);`;

          // Inserting new user into SQL database
          db.query(sql, [Password, FirstName, LastName, Client], (err, res) => {
            if(err) {
              // print errors to server console
              console.error("errors: ", err);
              return res.send(500); // Ends this post request with server error
            }

            res.status(201).json({ result: 'Account successfully created' });
          });
      
          // JWT - JSON Web Token
          const payload = {
            FirstName,
            LastName
          };

          jwt.sign(payload, config.get('jwtSecret'), { expiresIn: 36000 }, (err, token) => {
            if (err) throw err;
            return res.json({ token }); // Server responds to client with token
          });

        } // end of else statement

      });
    } catch (err) {
      console.error(err);
      return res.status(500).send('Sever Error');
    }
  }
);

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

  console.log('\nServer has started on port 7000\n');
});
