const formidable = require('formidable');
const fs = require('fs');
const FormData = require('form-data');

let transcriptLog = []; // in-memory transcript

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Form parse error:', err);
      return res.status(500).json({ error: 'Form parse error', details: err.message });
    }

    if (!files || !files.audio) {
      console.error('❌ No audio file received.');
      return res.status(400).json({ error: 'No audio file received' });
    }

    const file = files.audio;
    const fileStream = fs.createReadStream(file.filepath);

    try {
      const formData = new FormData();
      formData.append('file', fileStream, file.originalFilename || 'audio.webm');
      formData.append('model', 'whisper-1');

      console.log('📡 Sending audio to OpenAI...');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders()
        },
        body: formData
      });

      const text = await response.text();
      console.log('📩 Raw response from OpenAI:', text);

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
};
