export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const { path = [] } = req.query;
  const method = req.method;
  const endpoint = `https://api.d-id.com/${path.join('/')}`;

  let body = null;
  if (method !== 'GET' && method !== 'HEAD') {
    body = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }

  try {
    const didRes = await fetch(endpoint, {
      method,
      headers: {
        Authorization: `Basic ${process.env.DID_API_KEY}`,
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      body: body && method !== 'GET' && method !== 'HEAD' ? body : undefined,
    });

    const contentType = didRes.headers.get('content-type') || 'application/json';
    const text = await didRes.text();
    res.status(didRes.status).setHeader('Content-Type', contentType).send(text);
  } catch (err) {
    console.error('❌ Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}
