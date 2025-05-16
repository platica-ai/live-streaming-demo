const fs = require('fs');
const path = require('path');
const { IncomingForm } = require('formidable');
const FormData = require('form-data');
const axios = require('axios');
const { supabase } = require('./supabaseClient');

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

    const debugFilename = `${Date.now()}-${file.originalFilename}`;
    const tempFilePath = path.join('/tmp', debugFilename);

    try {
      // Copy the file to /tmp with a readable name
      fs.copyFileSync(file.filepath, tempFilePath);
      console.log('🧪 Saved debug file at:', tempFilePath);
    } catch (copyErr) {
      console.error('❌ Failed to save debug file:', copyErr);
    }

    // Upload to Supabase Storage
    const fileBuffer = fs.readFileSync(tempFilePath);
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('audio-debug')
      .upload(debugFilename, fileBuffer, {
        contentType: 'audio/webm',
        upsert: true,
      });

    if (uploadErr) {
      console.error('❌ Supabase upload error:', uploadErr);
      return res.status(500).json({ error: 'Supabase upload failed' });
    }

    const publicUrl = `https://tnbsunhhihibxaghyjnf.supabase.co/storage/v1/object/public/audio-debug/${debugFilename}`;
    console.log('🔗 Public file URL:', publicUrl);

    // Transcribe using OpenAI Whisper
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempFilePath), {
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

      transcriptLog.push({ text: data.text, url: publicUrl, timestamp: new Date().toISOString() });

      return res.status(200).json({
        text: data.text,
        url: publicUrl,
        transcriptLog,
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
