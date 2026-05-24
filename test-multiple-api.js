const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsImlhdCI6MTc3ODg1Njg0OCwiZXhwIjoxNzc4ODYwNDQ4fQ.C76o2W1bpHyvVnx9EnJrLJYdMo62c9y74yRHprZbO-c';

const endpoints = [
  '/api/v1/semesters',
  '/api/v1/buildings',
  '/api/v1/rooms',
  '/api/v1/majors',
  '/api/v1/classes',
  '/api/v1/teachers',
  '/api/v1/scheduling',
  '/api/v1/reservation'
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 7002,
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({ endpoint, status: res.statusCode, response: data.substring(0, 200) });
      });
    });

    req.on('error', (e) => {
      resolve({ endpoint, status: -1, response: `Error: ${e.message}` });
    });

    req.end();
  });
}

async function runTests() {
  console.log('Testing API endpoints...\n');

  const results = await Promise.all(endpoints.map(testEndpoint));

  results.forEach(({ endpoint, status, response }) => {
    const statusColor = status === 200 ? '\x1b[32m' : '\x1b[31m';
    const resetColor = '\x1b[0m';
    console.log(`${endpoint}`);
    console.log(`  Status: ${statusColor}${status}${resetColor}`);
    console.log(`  Response: ${response}\n`);
  });
}

runTests();