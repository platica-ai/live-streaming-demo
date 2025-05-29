const express = require('express');
const http = require('http');
const cors = require('cors');
const loadApiKey = require('./loadApiKey');
const fetch = require('node-fetch');

// Load DID API key from api.json if not provided in environment
loadApiKey();

const port = 3000;

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use('/', express.static(__dirname));
app.use(express.json());

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/ws-streaming', function (req, res) {
  res.sendFile(__dirname + '/index-ws.html');
});

app.get('/agents', function (req, res) {
  res.sendFile(__dirname + '/index-agents.html');
});

// Proxy D-ID API routes when using the simple Express server
app.all('/api/proxy-did/*', async (req, res) => {
  const targetPath = req.params[0];
  const url = `https://api.d-id.com/${targetPath}`;

  try {
    const proxyRes = await fetch(url, {
      method: req.method,
      headers: {
        Authorization: `Basic ${process.env.DID_API_KEY}`,
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      body: ['GET', 'HEAD'].includes(req.method)
        ? undefined
        : JSON.stringify(req.body),
    });

    const text = await proxyRes.text();
    if (proxyRes.headers.get('content-type')) {
      res.setHeader('Content-Type', proxyRes.headers.get('content-type'));
    }
    res.status(proxyRes.status).send(text);
  } catch (err) {
    console.error('❌ Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
});

const server = http.createServer(app);

server.listen(port, () =>
  console.log(
    `Server started on port localhost:${port}\nhttp://localhost:${port}\nhttp://localhost:${port}/agents\nhttp://localhost:${port}/ws-streaming`
  )
);
