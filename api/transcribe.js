const fs = require('fs');
const path = require('path');
const { IncomingForm } = require('formidable');
const FormData = require('form-data');
const axios = require('axios');

exports.config = {
  api: {
    bodyParser: false,
  },
};

let transcriptLog = [];

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Form parse error:', err);
      return res.status(500).json({ error: 'Form parse error' });
    }

    const fileArray = files.audio;
    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

    if (!file || !file.filepath) {
      return res.status(400).json({ error: 'Invalid file object, no path found.' });
    }

    const tempFilePath = path.join('/tmp', `${Date.now()}-${file.originalFilename}`);
    try {
      fs.copyFileSync(file.filepath, tempFilePath);
      console.log('🧪 Saved debug file at:', tempFilePath);
    } catch (copyErr) {
      console.error('❌ Failed to save debug file:', copyErr);
    }

    // Read raw buffer for debugging
    let audioBase64 = '';
    try {
      const audioBuffer = fs.readFileSync(tempFilePath);
      audioBase64 = audioBuffer.toString('base64');
    } catch (readErr) {
      console.error('❌ Failed to read debug file for base64:', readErr);
    }

    // Transcribe with OpenAI Whisper
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempFilePath), {
      filename: file.originalFilename || 'audio.webm',
      contentType: 'audio/webm',
    });
    formData.append('model', 'whisper-1');
    formData.append('language', 'es');

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

      const timestamp = new Date().toISOString();
      transcriptLog.push({ text: data.text, timestamp });

      return res.status(200).json({
        text: data.text,
        audioBase64,
        mimeType: file.mimetype,
        timestamp,
      });

    } catch (e) {
      console.error('❌ OpenAI error:', e.response?.data || e.message);
      return res.status(500).json({
        error: 'OpenAI error',
        details: e.response?.data || e.message,
      });
    }
  });
};
