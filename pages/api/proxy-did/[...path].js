// pages/api/proxy-did/[...path].js

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const targetPath = req.query.path.join('/');
  const proxyUrl = `https://api.d-id.com/${targetPath}`;

  let body = null;

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', (chunk) => chunks.push(chunk));
      req.on('end', () => resolve(Buffer.concat(chunks)));
      req.on('error', reject);
    });
  }

  try {
    const proxyRes = await fetch(proxyUrl, {
      method: req.method,
      headers: {
        Authorization: `Basic ${process.env.DID_API_KEY}`,
        'Content-Type': req.headers['content-type'] || 'application/json',
      },
      body: body && req.method !== 'GET' && req.method !== 'HEAD' ? body : undefined,
    });

    const contentType = proxyRes.headers.get('content-type') || 'application/json';
    const text = await proxyRes.text();

    res.status(proxyRes.status).setHeader('Content-Type', contentType).send(text);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).send('Internal Server Error');
  }
}
