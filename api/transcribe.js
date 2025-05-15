export const config = {
  api: {
    bodyParser: false,
  },
};

import { IncomingForm } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios'; // ✅ Using axios for multipart reliability on Vercel

let transcriptLog = [];

export default async function handler(req, res) {
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
      return res.status(400).json({ error: 'Inva
