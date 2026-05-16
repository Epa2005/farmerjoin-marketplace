const { spawn } = require('child_process');
const path = require('path');

console.log('Starting FarmerJoin Application...');

// Start backend server
const backend = spawn('node', ['server.js'], {
  cwd: path.join(__dirname),
  stdio: 'inherit'
});

backend.on('close', (code) => {
  console.log(`Backend server exited with code ${code}`);
});

backend.on('error', (err) => {
  console.error('Failed to start backend server:', err);
});
