const express = require('express');
const http = require('http');
const cors = require('cors');
const loadApiKey = require('./loadApiKey');

// Load DID API key from api.json if not provided in environment
loadApiKey();

const port = 3000;

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use('/', express.static(__dirname));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/ws-streaming', function (req, res) {
  res.sendFile(__dirname + '/index-ws.html');
});

app.get('/agents', function (req, res) {
  res.sendFile(__dirname + '/index-agents.html');
});

const server = http.createServer(app);

server.listen(port, () =>
  console.log(
    `Server started on port localhost:${port}\nhttp://localhost:${port}\nhttp://localhost:${port}/agents\nhttp://localhost:${port}/ws-streaming`
  )
loadApiKey.js
New
+24
-0

const fs = require('fs');
const path = require('path');

function loadApiKey() {
  if (process.env.DID_API_KEY) {
    return process.env.DID_API_KEY;
  }

  try {
    const filePath = path.join(__dirname, 'api.json');
    const data = fs.readFileSync(filePath, 'utf8');
    const { key } = JSON.parse(data);
    if (key) {
      process.env.DID_API_KEY = key;
      return key;
    }
  } catch (err) {
    console.warn('⚠️  Unable to read DID_API_KEY from api.json:', err.message);
  }

  return undefined;
}

module.exports = loadApiKey;
