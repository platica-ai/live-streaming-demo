import express from 'express';
import http from 'http';
import cors from 'cors';
import loadApiKey from './loadApiKey.js';
import fetch from 'node-fetch';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load DID API key from api.json if not provided in environment
loadApiKey();

const port = 3000;

const app = express();
// Allow requests from any origin
app.use(cors());
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
     `Server started on port ${port}\n` +
      `http://<host>:${port}\n` +
      `http://<host>:${port}/agents\n` +
      `http://<host>:${port}/ws-streaming`
  )
);
