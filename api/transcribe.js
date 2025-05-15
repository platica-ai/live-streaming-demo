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
      console.error('❌ Missing audio file in form data.');
      return res.status(400).json({ error: 'Missing audio file in form data' });
    }

    const file = files.audio;
    const fileStream = fs.createReadStream(file.filepath);

    try {
      const formData = createFormData(fileStream, file.originalFilename || 'audio.webm');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenAI API error:', errorText);
        return res.status(500).json({ error: 'OpenAI error', details: errorText });
      }

      const data = await response.json();

      transcriptLog.push({
        text: data.text,
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        text: data.text,
        transcriptLog
      });

    } catch (e) {
      console.error('❌ Unexpected server error:', e);
      return res.status(500).json({ error: 'Unexpected error', message: e.message });
    }
  });
}

function createFormData(fileStream, filename) {
  const FormData = require('form-data');
  const form = new FormData();
  form.append('file', fileStream, filename);
  form.append('model', 'whisper-1');
  return form;
}
