const express = require('express');
const cookieParser = require('cookie-parser');
const mysql = require('mysql');

const bcrypt = require('bcryptjs'); // For hashing password
const jwt = require('jsonwebtoken'); // For sending/decrypting tokens
const config = require('config'); // Config used to obtain JWT secret key

const app = express();
//to handle json body requests
app.use(express.urlencoded({ extended: false }), express.json());
// to handle cookies
app.use(cookieParser());

// For CSS/Images and javascript to be used in HTML pages
app.use('/static', express.static('./static/'));

const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: 'Moreno1@',
  database: 'tech4513',
});

// Connect to mysql database
db.connect();

// homepage - private route requires authorization
app.get('/', (req, res) => {
  // if token cookie exists then we want to display the homepage
  if (req.cookies.token) {
    // decode the token using the key found in '\config\default.json'
    const userInfo = jwt.verify(req.cookies.token, config.get('jwtSecret'));

    // Make a variable for each value found in token
    const { UserID, FirstName, LastName } = userInfo;
    // Uncomment to see what the userInfo object looks like
    //console.log(userInfo);

    // Verfiy this user exists in the database
    // The token should have a userID, FirstName, LastName

    const sqlQuery =
      'SELECT * FROM tech4513.user WHERE UserID = ? and FirstName = ? and LastName = ?';

    db.query(sqlQuery, [UserID, FirstName, LastName], (err, result) => {
      if (err) {
        console.error('Error: ', err);
        res.status(500).send('Database error, check NodeJS');
      }
      // Check if user exists in the database
      // if they dont exists the result.length is 0 from mysql
      if (result.length == 0) {
        // send the user to /login if they dont exist in mysql database
        res.redirect('/login');
      } else {
        // Setting client cookie - 0 for tech, 1 for client
        // Cookies are read in static/fetch.js
        res.cookie('client', result[0].Client);

        // If the user does exist, send the index html page
        res.sendFile(__dirname + '\\client\\index.html');
      }
    });
  } else {
    // If there is no cookie then send to login
    res.redirect('/login');
  }
});

// register get request - html page
app.get('/register', (req, res) => {
  res.sendFile(__dirname + '\\client\\register.html');
});

// register post request - send user info
app.post('/register', (req, res) => {
  // Pull variables from req.body
  let { FirstName, LastName, Password, Client } = req.body;

  try {
    // Check if user already exists in DB before adding
    const sqlCheckUser =
      'SELECT * FROM tech4513.user WHERE FirstName = ? and LastName = ?;';

    // asynchronous, awaiting hash for password
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
          Error: 'User ' + FirstName + ' ' + LastName + ' already exists',
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
            // Uncomment to see printed result from insert query
            // console.log(result);

            // JWT - JSON Web Token
            const payload = {
              FirstName,
              LastName,
              UserID: result.insertId, // result.insertId is the UserID that is automatically incremented and added in the database (AUTO INT)
              Client,
            };

            // Create JWT token and store in cookie
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
          }
        );
      } // end of else statement
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Sever Error');
  }
});

// Login page GET request
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '\\client\\login.html');
});

// Login post request
// authenticate user by checking database records then retrieve an access token
app.post('/login', (req, res) => {
  // Check if there is already a token

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

      // The token will hold userID, FirstName and LastName
      // This can be used to verify if a user is authorized by checking the database for this information
      const payload = {
        UserID: result[0].UserID,
        FirstName: result[0].FirstName,
        LastName: result[0].LastName,
        Client: result[0].Client,
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
      // status 400 means bad user input
      return res.status(400).json({ Error: 'No user found with that name' });
    }
  });
});

// GET technician list
app.get('/users', (req, res) => {
  let sqlQuery =
    'SELECT FirstName, LastName, UserID FROM user where Client = 0;';

  db.query(sqlQuery, (err, result) => {
    if (err) throw err;

    res.send(result);
  });
});

// GET client_dashboard html page - only for clients
// We authorize by cookie in client_fetch
app.get('/client_dashboard', (req, res) => {
  res.sendFile(__dirname + '\\client\\client_dashboard.html');
});

// GET system log tickets
// Private route - need token to verify
app.get('/systemlog', (req, res) => {
  // decode token to get UserID
  // Depending on whether the user is a client, change the sqlQuery
  const loggedInUser = jwt.verify(req.cookies.token, config.get('jwtSecret'))
    .UserID;

  let sqlQuery;
  sqlQuery = `
  SELECT CONCAT(tech_user.FirstName, ' ', tech_user.LastName) AS Tech, 
	systemlog.Description, 
    CONCAT(client_user.FirstName, ' ', client_user.LastName) AS Client,
    systemlog.Status,
    systemlog.Date
FROM
    systemlog 
INNER JOIN 
    user tech_user
ON 
    systemlog.TechnicianID = tech_user.UserID
INNER JOIN 
    user client_user
ON 
    systemlog.AssignedBy = client_user.UserID
WHERE tech_user.UserID = ?
OR client_user.UserID = ?;
    `;

  db.query(sqlQuery, [loggedInUser, loggedInUser], (err, result) => {
    if (err) throw err;

    res.send(result);
  });
});

// POST request for systemlog
app.post('/systemlog', (req, res) => {
  // decode token to get user login FirstName and LastName
  // It will be automatically added to the ticket
  // decode the token using the key found in '\config\default.json'
  const loggedInUser = jwt.verify(req.cookies.token, config.get('jwtSecret'))
    .UserID;

  // Line 28 of static/client_fetch.js sets the value of technicians to the UserID of the technician
  // We convert technicians from string to integer with parseInt()
  const UserID = parseInt(req.body.technicians);
  const Description = req.body.Description;

  const sqlQuery =
    'INSERT INTO systemlog (TechnicianID, Description, AssignedBy, Status) VALUES (?, ?, ?, ?);';

  db.query(
    sqlQuery,
    [UserID, Description, loggedInUser, 'In Progress'],
    (err, result) => {
      if (err) {
        console.error('Error: ', err);
        res.status(500).send('Database error');
      }

      console.log('system log ticket created successfully');
    }
  );
  res.status(201);
  res.redirect('http://localhost:7000/client_dashboard');
});

// remove Ticket by making POST request to /remove_systemlog
// Only clients have the ability to remove a ticket
app.post('/remove_systemlog', (req, res) => {
  const { Description, Date } = req.body;

  const sqlQuery =
    'DELETE FROM systemlog WHERE Description = ? and (date(Date) >= ? OR date(Date) <= ?);';

  db.query(sqlQuery, [Description, Date, Date], (err, result) => {
    if (err) {
      console.error('ERROR: ', err);
      res.sendStatus(500);
    }

    res.redirect('/client_dashboard');
  });
});

// Complete tickets - Technicians complete tickets
// UPDATE
app.post('/complete_systemlog', (req, res) => {
  const { Description, Date } = req.body;

  const sqlQuery = `UPDATE systemlog SET Status = ? WHERE Description = ? and (date(Date) >= ? OR date(Date) <= ?);`;

  db.query(sqlQuery, ['Resolved', Description, Date, Date], (err, result) => {
    if (err) {
      console.error('ERROR: ', err);
      res.status(500).redirect('/');
    }
  });

  res.redirect('/');
});

// server start listening on port 7000
app.listen(7000, (err) => {
  if (err) throw err;

  console.log('\nServer has started on port 7000\n');
});
