// Simple syntax test
const fs = require('fs');
try {
  const serverCode = fs.readFileSync('server.js', 'utf8');
  new Function(serverCode);
  console.log('✅ Syntax is valid');
} catch (error) {
  console.error('❌ Syntax error:', error.message);
  process.exit(1);
}
