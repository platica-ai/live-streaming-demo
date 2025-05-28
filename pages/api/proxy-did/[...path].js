export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  const targetPath = req.query.path.join('/');
  const proxyUrl = `https://api.d-id.com/${targetPath}`;

  const method = req.method;
  const headers = {
    Authorization: `Basic ${process.env.DID_API_KEY}`,
    'Content-Type': 'application/json',
  };

  let body = null;

  if (method !== 'GET' && method !== 'HEAD') {
    body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => (data += chunk));
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
  }

  try {
    const proxyRes = await fetch(proxyUrl, { method, headers, body });
    const result = await proxyRes.text();

    res.status(proxyRes.status).setHeader('Content-Type', 'application/json');
    res.send(result);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy failed', details: error.message });
  }
}
