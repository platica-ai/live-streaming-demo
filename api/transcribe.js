// pages/api/transcribe.js
import formidable from 'formidable';
import fs from 'fs';

// Store transcriptions so they can be retrieved via api/transcript.js
export const transcriptLog = [];

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const form = new formidable.IncomingForm();
       const { files } = await form.parse(req);

   // Formidable may return the file object or an array depending on configuration
    const file = Array.isArray(files.audio) ? files.audio[0] : files.audio;
    if (!file || !file.filepath) {
      throw new Error('No audio file provided.');
    }

 const audioData = await fs.promises.readFile(file.filepath);

    const formData = new FormData();
     formData.append(
      'file',
      new Blob([audioData], { type: file.mimetype || 'audio/webm' }),
      file.originalFilename || 'audio.webm'
    );
    formData.append('model', 'whisper-1');
    formData.append('language', 'es');
    formData.append('prompt', 'Transcribe only clear spoken Spanish phrases, ignore background noise.');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorMsg = await whisperResponse.text();
      throw new Error(`Whisper API error: ${errorMsg}`);
    }

    const whisperResult = await whisperResponse.json();

    transcriptLog.push({ text: whisperResult.text, timestamp: new Date().toISOString() });

    return res.status(200).json({ text: whisperResult.text });

  } catch (err) {
    console.error('❌ Transcription Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
