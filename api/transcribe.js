export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from 'formidable';
import fs from 'fs';
import { Readable } from 'stream';

let transcriptLog = [];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
  if (err) {
    console.error('❌ Form parse error:', err);
    return res.status(500).json({ error: 'Form parse error' });
  }

  if (!files || !files.audio) {
    console.error('❌ No audio file received.');
    return res.status(400).json({ error: 'No audio file received' });
  }

  const file = files.audio;
  const fileStream = fs.createReadStream(file.filepath);

  try {
    const formData = createFormData(fileStream, file.originalFilename || 'audio.webm');
    console.log('📦 Sending to OpenAI with headers:', formData.getHeaders());

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const text = await response.text(); // Use text first for better debugging
    console.log('📩 OpenAI response raw:', text);

    if (!response.ok) {
      return res.status(500).json({ error: 'OpenAI error', details: text });
    }

    const data = JSON.parse(text);
    transcriptLog.push({ text: data.text, timestamp: new Date().toISOString() });

    return res.status(200).json({ text: data.text, transcriptLog });

  } catch (e) {
    console.error('❌ Unexpected error:', e);
    return res.status(500).json({ error: 'Unexpected error', message: e.message });
  }
});


function createFormData(fileStream, filename) {
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fileStream, filename);
  form.append('model', 'whisper-1');
  return form;
}
