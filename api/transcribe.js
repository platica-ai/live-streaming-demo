import formidable from 'formidable';
import { Readable } from 'stream';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

    const file = files.audio;
    if (!file || !file[0] || !file[0].originalFilename || !file[0]._writeStream || !file[0]._writeStream._buffer) {
      console.error('❌ Invalid file object:', file);
      return res.status(400).json({ error: 'Invalid file object, no buffer found.' });
    }

    const buffer = file[0]._writeStream._buffer;
    const filename = file[0].originalFilename;

    try {
      const formData = new FormData();
      formData.append('file', Readable.from(buffer), filename);
      formData.append('model', 'whisper-1');

      const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      const text = await openaiRes.text(); // easier to debug
      console.log('📩 OpenAI response raw:', text);

      if (!openaiRes.ok) {
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
