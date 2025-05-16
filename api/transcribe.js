const fs = require('fs');
const { IncomingForm } = require('formidable');
const FormData = require('form-data');
const axios = require('axios');

exports.config = {
  api: {
    bodyParser: false,
  },
};

let transcriptLog = [];
let lastAudioFilename = null; // 🆕 Store the most recent audio file name

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const form = new IncomingForm({ keepExtensions: true });

  form.on('file', (field, file) => {
    console.log('📥 Got file:', field, file.originalFilename, file.mimetype, file.filepath);
  });

  form.parse(req, async (err, fields, files) => {
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
    lastAudioFilename = file.newFilename; // 🆕 Save filename for debug route

    const formData = new FormData();
    formData.append('file', fileStream, {
      filename: file.originalFilename || 'audio.webm',
      contentType: 'audio/webm',
    });
    formData.append('model', 'whisper-1');
    formData.append('language', 'es'); // Force Spanish transcription

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            ...formData.getHeaders(),
          },
        }
      );

      const data = response.data;
      console.log('🔵 OpenAI response:', data);

      transcriptLog.push({ text: data.text, timestamp: new Date().toISOString(), filename: lastAudioFilename });

      return res.status(200).json({ text: data.text, transcriptLog, filename: lastAudioFilename });

    } catch (e) {
      console.error('❌ OpenAI error:', e.response?.data || e.message);
      return res.status(500).json({
        error: 'OpenAI error',
        details: e.response?.data || e.message,
      });
    }
  });
};

// 🆕 Expose last filename to other modules
module.exports.lastAudioFilename = () => lastAudioFilename;
