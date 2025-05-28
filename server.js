const express = require('express');
const next = require('next');
const loadApiKey = require('./loadApiKey');

// Load DID API key from api.json if not provided in environment
loadApiKey();

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Add a response for the root route
  server.get('/', (req, res) => {
    res.send('✅ D-ID backend is running on Render');
  });

  // Endpoint to expose API keys
  server.get('/api/env', (req, res) => {
    res.json({
      DID_API_KEY: process.env.DID_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    });
  });

  // Let Next.js handle everything else
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
