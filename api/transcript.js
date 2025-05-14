import { transcriptLog } from './transcribe.js';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET allowed' });
  }

  res.status(200).json({ transcriptLog });
}
