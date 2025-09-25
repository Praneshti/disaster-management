#!/usr/bin/env node
const fs = require('fs');
const path = require('path');


const [,, cmd, arg] = process.argv;
if (!cmd) {
  console.log('Usage: node scripts/cli.js log:resource "type,quantity,location"');
  process.exit(0);
}

if (cmd === 'log:resource') {
  const [type, quantity, location] = (arg || '').split(',');
  const line = `${new Date().toISOString()} | ${type} | ${quantity} | ${location}\n`;
  const file = path.join(__dirname, '..', 'logs', 'resource-log.txt');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, line);
  console.log('Logged resource:', line.trim());
} else {
  console.log('Unknown command');
}
