export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from 'formidable';
import fs from 'fs';
import { Readable } from 'stream';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Form parse error' });

    const file = files.audio;
    const fileStream = fs.createReadStream(file.filepath);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: createFormData(fileStream, 'audio.webm')
    });

    const data = await response.json();
    res.status(200).json(data);
  });
}

function createFormData(fileStream, filename) {
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fileStream, filename);
  form.append('model', 'whisper-1');
  return form;
}
