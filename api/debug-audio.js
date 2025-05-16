const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  const { filename } = req.query;

  if (!filename || !filename.endsWith('.webm')) {
    return res.status(400).json({ error: 'Missing or invalid filename param' });
  }

  const filePath = path.join('/tmp', filename);

  try {
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': 'audio/webm',
      'Content-Length': stat.size,
    });
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('❌ File not found:', filePath, err);
    res.status(404).json({ error: 'File not found' });
  }
};
