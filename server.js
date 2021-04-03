const express = require('express');
const cookieParser = require('cookie-parser');
const mysql = require('mysql');

const bcrypt = require('bcryptjs'); // For hashing password
const jwt = require('jsonwebtoken'); // For sending/decrypting tokens
const config = require('config'); // Config used to obtain JWT secret

const app = express();
//to handle json body requests
app.use(express.urlencoded({ extended: false }), express.json());
// to handle cookies
app.use(cookieParser());

const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'Moreno1@',
  database: 'tech4513',
});

// Connect to mysql database
db.connect();

// homepage
app.get('/', (req, res) => {
  console.log(req.cookies);
  // __dirname is the current directory/file
  res.sendFile(__dirname + '\\client\\index.html');
});

// register get request - html page
app.get('/register', (req, res) => {
  res.sendFile(__dirname + '\\client\\register.html');
});

// register post request - send user info
app.post(
  '/register',
  // asynchronous, awaiting hash for password
  (req, res) => {
    // Pull variables from req.body
    let { FirstName, LastName, Password, Client } = req.body;

    try {
      // Check if already exists in DB before adding
      const sqlCheckUser =
        'SELECT * FROM tech4513.user WHERE FirstName = ? and LastName = ?;';

      db.query(sqlCheckUser, [FirstName, LastName], async (err, result) => {
        // asynchronous due to awaiting hashing functions
        if (err) {
          console.error('errors: ', err); // Print errors onto server console
          return res.status(500).send('Server Error'); // Ends this post request
        } else if (result.length) {
          // if res is not empty, then a user with first & last name exists
          console.log(
            'Failed creating user - user with that name already created'
          );
          // respond with status 400 (user request error) and description of error
          return res.status(400).json({
            Error: 'User ' + FirstName + ' ' + LastName + ' already taken',
          });
        } else {
          // Encrypt the password
          const salt = await bcrypt.genSalt(10);
          Password = await bcrypt.hash(Password, salt);

          // Insert Statement
          const sql =
            'INSERT INTO user (Password, FirstName, LastName, Client) VALUES (?, ?, ?, ?);';

          // Inserting new user into SQL database
          db.query(
            sql,
            [Password, FirstName, LastName, Client],
            (err, result) => {
              if (err) {
                // print errors to server console
                console.error('errors: ', err);
                return res.status(500).send('Server Error'); // Ends this post request with server error
              }

              // return res
              //   .status(201)
              //   .json({ result: 'Account successfully created' });
              console.log('New user account created successfully');
            }
          );

          // JWT - JSON Web Token
          const payload = {
            FirstName,
            LastName,
          };

          jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 36000 },
            (err, token) => {
              if (err) {
                console.error('Errors: ', err);
                return;
              }
              res.cookie('token', token); // Server responds to client with token
              // Successful creation (status 201) and redirect to the homepage
              res.status(201).redirect('/');
            }
          );
        } // end of else statement
      });
    } catch (err) {
      console.error(err);
      return res.status(500).send('Sever Error');
    }
  }
);

// middleware to authenticate token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader;

  if (token == null) return res.sendStatus(401);

  console.log(authHeader);

  jwt.verify(token, config.get('jwtSecret'), (err, user) => {
    if (err) return res.sendStatus(403); // invalid token - could be expired

    req.user = user; // setting req.user to the user object defined in jwt.verify()
    next(); // move on to next function
  });
}

// Login post request
// authenticate user by checking database records then retrieve an access token
app.post('/login', (req, res) => {
  // Login with FirstName, LastName and Password
  const { FirstName, LastName, Password } = req.body;

  let sqlQuery =
    'SELECT * FROM tech4513.user WHERE FirstName = ? and LastName = ?';

  db.query(sqlQuery, [FirstName, LastName], async (err, result) => {
    if (err) {
      console.error('Errors: ', err);
      return;
    }

    // If result.length is not empty, then user exists
    if (result.length) {
      // SQL returns a result in index 0
      // we assign the Password to the hashedPassword variable
      let hashedPassword = result[0].Password;

      // compare user input password with hashed password in database
      // this is done with bcrypt .compare() function
      // must wait to check if hashed password and user inputted passwords match
      const isMatch = await bcrypt.compare(Password, hashedPassword);

      // If there is no match, then user inputted invalid credentials
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      // If there is a match then we can create a token

      // Print to server that login was a success
      console.log('Logged in Successfully');

      const payload = {
        user: {
          id: result[0].UserID,
          FirstName: result[0].FirstName,
          LastName: result[0].LastName,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        {
          expiresIn: 36000, // expires in 10 hours
        },
        (err, token) => {
          if (err) throw err;
          // return the access token as cookie
          res.cookie('token', token);
          // Successful loging (status 200 = OK) then redirect to the homepage
          res.status(200).redirect('/');
        }
      );
    } else {
      return res.status(400).json({ Error: 'No user found with that name' });
    }
  });
});

// Get route technicians
app.get('/users', (req, res) => {
  const sql = 'SELECT FirstName, LastName FROM user where Client = 0;';

  db.query(sql, (err, result) => {
    if (err) throw err;

    res.send(result);
  });
});

// server start listening on port 7000
app.listen(7000, (err) => {
  if (err) throw err;

  console.log('\nServer has started on port 7000\n');
});
