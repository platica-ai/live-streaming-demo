// /api/transcribe.js

import { Readable } from 'stream';
import busboy from 'busboy';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

const transcriptLog = [];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const bb = busboy({ headers: req.headers });

    let audioBuffer = null;
    let filename = 'audio.webm';

    bb.on('file', (name, file, info) => {
      filename = info.filename || filename;

      const chunks = [];
      file.on('data', chunk => chunks.push(chunk));
      file.on('end', () => {
        audioBuffer = Buffer.concat(chunks);
      });
    });

    bb.on('finish', async () => {
      if (!audioBuffer) {
        return res.status(400).json({ error: 'No audio file received' });
      }

      const form = new FormData();
      form.append('file', audioBuffer, {
        filename,
        contentType: 'audio/webm',
      });
      form.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...form.getHeaders(),
        },
        body: form,
      });

      const rawText = await response.text();
      console.log('📝 OpenAI response:', rawText);

      if (!response.ok) {
        return res.status(500).json({ error: 'OpenAI error', details: rawText });
      }

      const data = JSON.parse(rawText);
      transcriptLog.push({ text: data.text, timestamp: new Date().toISOString() });

      return res.status(200).json({ text: data.text, transcriptLog });
    });

    req.pipe(bb);
  } catch (err) {
    console.error('❌ Transcription error:', err);
    return res.status(500).json({ error: 'Unexpected error', message: err.message });
  }
}
