const http = require('http');

async function testSemesters() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 7001,
      path: '/api/v1/semesters',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJOYW1lIjoiYWRtaW4iLCJpYXQiOjE3MTU2MTcxNjJ9.NH1xJ5X7n0aYt9r3u1b0F8NnI2y7r7lN9e5V8y7k8I'
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function testMajors() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 7001,
      path: '/api/v1/majors',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJOYW1lIjoiYWRtaW4iLCJpYXQiOjE3MTU2MTcxNjJ9.NH1xJ5X7n0aYt9r3u1b0F8NnI2y7r7lN9e5V8y7k8I'
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('=== Testing Semesters API ===');
  const semesters = await testSemesters();
  console.log(JSON.stringify(semesters, null, 2));
  
  console.log('\n=== Testing Majors API ===');
  const majors = await testMajors();
  console.log(JSON.stringify(majors, null, 2));
}

run().catch(console.error);