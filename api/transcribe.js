export const config = {
  api: {
    bodyParser: false,
  },
};

import { IncomingForm } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

let transcriptLog = [];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    form.on('file', (field, file) => {
  console.log('📥 Got file:', field, file.originalFilename, file.mimetype, file.filepath);
});
    console.log('🎤 Files received:', files);
    if (err) {
      console.error('❌ Form parse error:', err);
      return res.status(500).json({ error: 'Form parse error' });
    }

    const fileArray = files.audio;
    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

    if (!file || !file.filepath) {
      return res.status(400).json({ error: 'Invalid file object, no path found.' });
    }

    const fileStream = fs.createReadStream(file.filepath);

       const formData = new FormData();
       formData.append('file', fileStream, 'audio.webm');
       formData.append('model', 'whisper-1');


    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      const text = await response.text();
      console.log('🔵 OpenAI response:', text);

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
}
