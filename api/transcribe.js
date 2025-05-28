import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Only POST method allowed' });
  }

  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error parsing file upload' });
    }

    const audioFile = files.audio[0]; // Adjust if your formidable version differs
    const audioBlob = fs.createReadStream(audioFile.filepath);

    const whisperForm = new FormData();
    whisperForm.append('file', audioBlob, 'audio.webm');
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('language', 'es'); // explicitly set language to Spanish
    whisperForm.append('prompt', 'Transcribe only clear spoken Spanish phrases, ignore background noise.');

    try {
      const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: whisperForm,
      });

      if (!whisperRes.ok) {
        const errorText = await whisperRes.text();
        throw new Error(`Whisper API failed: ${errorText}`);
      }

      const whisperData = await whisperRes.json();
      res.status(200).json({ text: whisperData.text });
    } catch (error) {
      console.error('Whisper API Error:', error);
      res.status(500).json({ error: 'Transcription failed', details: error.message });
    }
  });
}
