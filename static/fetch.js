// If user is a client then we redirect to client dashboard
if (
  document.cookie.split(';')[0].trim() == 'client=1' ||
  document.cookie.split(';')[1].trim() == 'client=1'
) {
  window.location.replace('http://localhost:7000/client_dashboard');
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
          <form method="POST" action="/complete_systemlog" id='tickets'>
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
          <input type="submit" value="COMPLETE TICKET">
          </form>
          </br>
          `;
        })
        .join('');

      // The html above is added to the html page
      // '#technicians' is the id='technicians'
      document.querySelector('h1').insertAdjacentHTML('afterend', html);
    });
}

// If client = 0, then we know a technician is logged into
// the dashboard. We show all the tickets assigned to him/her
if (
  document.cookie.split(';')[0] == 'client=0' ||
  document.cookie.split(';')[1] == 'client=0'
) {
  fetchTickets();
}

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
