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
