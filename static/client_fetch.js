// Used for client to make a systemlog post
function fetchTechs() {
  // fetch a response from /users
  fetch('http://localhost:7000/users')
    // then we convert response to JSON
    .then((res) => {
      // If response is NOT (!) ok then throw an error
      if (!res.ok) {
        throw Error('Error - Response not OK');
      }
      return res.json(); //  return JSON of technicians in database
    })
    // then add the information to html
    .then((data) => {
      // console.log(data);

      // HTML form for client to make a system log post
      // Select a technician
      // Type description

      // We will go through each technician in data
      // We will return html containing data of each technician
      // .map() returns an array of all the html
      // we use .join("") to bring all the html together into one string
      const html = data
        .map((tech) => {
          return `
          <option value=${tech.UserID}>
            ${tech.FirstName} ${tech.LastName}
          </option>
          `;
        })
        .join('');

      // The html above is added to the html page
      // '#technicians' is the id='technicians'
      document
        .querySelector('#technicians')
        .insertAdjacentHTML('afterbegin', html);
    });
}

// cookie contains token from jwt and client (0 or 1)
// we split it by the semicolon (this creates an array)
// client cookie found at index 0 or 1 of the array

// Check if logged in user is a client (equal to 1)
if (
  document.cookie.split(';')[0].trim() == 'client=1' ||
  document.cookie.split(';')[1].trim() == 'client=1'
) {
  fetchTechs();
}

// GET the systemlog tickets
function fetchTickets() {
  // fetch a response from /users
  fetch('http://localhost:7000/systemlog')
    // then we convert response to JSON
    .then((res) => {
      // If response is NOT (!) ok then throw an error
      if (!res.ok) {
        throw Error('Error - Response not OK');
      }
      return res.json(); //  return JSON of technicians in database
    })
    // then add the information to html
    .then((data) => {
      // HTML form for client to make a system log post
      // Select a technician
      // Type description

      // We will go through each technician in data
      // We will return html containing data of each technician
      // .map() returns an array of all the html
      // we use .join("") to bring all the html together into one string

      const html = data
        .map((ticket, i) => {
          return `
          <form method="POST" action="/remove_systemlog" id='tickets'>
          <h3>Ticket # ${i}</h3>
          <p><b>Client: </b>${ticket.Client}</p>
          <p><b>Description: </b>${ticket.Description}</p>
          <input type="hidden" name="Description" value="${
            ticket.Description
          }"></input>
          <p><b>Technician: </b>${ticket.Tech}</p>
          <p><b>Status: </b>${ticket.Status}</p>
          <input type="hidden" name="Date" value=${ticket.Date.slice(
            0,
            19
          ).replace('T', ' ')}></input>
          <p><b>Date: </b>${ticket.Date.slice(0, 19).replace('T', ' ')}</p>
          <input type="submit" value="DELETE">
          </form>
          </br>
          `;
        })
        .join('');

      // The html above is added to the html page
      // '#technicians' is the id='technicians'
      document
        .querySelector('#client_form')
        .insertAdjacentHTML('afterend', html);
    });
}

fetchTickets();

// For logout button
function deleteAllCookies() {
  var cookies = document.cookie.split(';');

  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    var eqPos = cookie.indexOf('=');
    var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  window.location.replace('http://localhost:7000/login');
}
