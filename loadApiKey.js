import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function loadApiKey() {
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

