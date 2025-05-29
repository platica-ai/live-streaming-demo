import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new formidable.IncomingForm();
    const [fields, files] = await form.parse(req);

    const audioFile = files.audio[0];
    const audioData = fs.readFileSync(audioFile.filepath);

    const formData = new FormData();
    formData.append('file', new Blob([audioData]), 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'es');
    formData.append('prompt', 'Transcribe only clear spoken Spanish phrases, ignore background noise.');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errText = await whisperResponse.text();
      throw new Error(`Whisper API error: ${errText}`);
    }

    const whisperResult = await whisperResponse.json();
    res.status(200).json({ text: whisperResult.text });
  } catch (err) {
    console.error('Transcription Error:', err);
    res.status(500).json({ error: err.message });
  }
}
