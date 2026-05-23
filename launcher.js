const { spawn, exec } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '=========================================================');
console.log('\x1b[36m%s\x1b[0m', '   ⚡ DY PRODUCTIVITY TOOL STANDALONE LAUNCHER ACTIVE ⚡');
console.log('\x1b[36m%s\x1b[0m', '=========================================================');
console.log('\x1b[35m%s\x1b[0m', '📦 Initializing backend MERN database and frontend servers concurrently...\n');

// Path configurations
const rootDir = __dirname;

// Launch server processes concurrently using root npm dev trigger
const serverProcess = spawn('npm', ['run', 'dev'], {
  cwd: rootDir,
  shell: true,
  stdio: 'pipe'
});

let browserOpened = false;

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output.trim());

  // Detect when Vite server is active and listen port is mapped
  if ((output.includes('http://localhost:5173') || output.includes('localhost:5173') || output.includes('5173')) && !browserOpened) {
    browserOpened = true;
    console.log('\n\x1b[32m%s\x1b[0m', '🌐 Servers are active! Launching default web browser...');
    
    // Auto launch default browser under Windows environments
    exec('start http://localhost:5173', (err) => {
      if (err) {
        console.error('Failed to open web browser. Please visit: http://localhost:5173', err);
      }
    });
  }
});

serverProcess.stderr.on('data', (data) => {
  console.error('\x1b[31m%s\x1b[0m', data.toString().trim());
});

serverProcess.on('close', (code) => {
  console.log(`\nLauncher closed with exit code ${code}`);
  process.exit(code);
});

// Handle CTRL+C graceful termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping background servers gracefully. Please wait...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});
