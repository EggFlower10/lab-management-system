console.log('Checking basic Node.js functionality...');

try {
  console.log('Step 1: Testing require...');
  const express = require('express');
  console.log('Express version:', express.version);
  
  console.log('Step 2: Testing database...');
  const Database = require('better-sqlite3');
  
  console.log('Step 3: Trying to open database...');
  const db = new Database('database/lab_management.db');
  console.log('Database opened successfully');
  
  console.log('Step 4: Testing query...');
  const result = db.prepare('SELECT 1 as test').get();
  console.log('Query result:', result);
  
  db.close();
  console.log('All checks passed!');
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}