export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const streamId = req.query.streamId;

  let body = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }

  try {
    const didRes = await fetch(`https://api.d-id.com/talks/streams/${streamId}/sdp`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${process.env.DID_API_KEY}`,
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      body,
    });

    const text = await didRes.text();
    res
      .status(didRes.status)
      .setHeader('Content-Type', didRes.headers.get('content-type') || 'application/json')
      .send(text);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ error: 'Proxy error' });
  }
}
