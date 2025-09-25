const express = require('express');
const path = require('path');

const app = express();

// Simple route
app.get('/', (req, res) => {
  res.send('Server is working!');
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Minimal server running on http://localhost:${PORT}`);
});
