const http = require('http');

const options = {
  hostname: 'localhost',
  port: 7001,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': 38
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Login:', data);
    const result = JSON.parse(data);
    if (result.data && result.data.token) {
      testTasks(result.data.token);
    }
  });
});

req.write('{"username":"admin","password":"123456"}');
req.end();

function testTasks(token) {
  const options = {
    hostname: 'localhost',
    port: 7001,
    path: '/api/v1/experiment-tasks',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('Tasks:', data);
    });
  });

  req.end();
}