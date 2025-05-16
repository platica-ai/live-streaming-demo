// pages/api/proxy-did.js
import https from 'https';

export default async function handler(req, res) {
  const { method, body, headers, url } = req;

  const targetPath = req.url.replace('/api/proxy-did', '');

  const proxyUrl = `https://api.d-id.com${targetPath}`;

  try {
    const didRes = await fetch(proxyUrl, {
      method,
      headers: {
        Authorization: `Basic ${process.env.DID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: method !== 'GET' && method !== 'HEAD' ? JSON.stringify(body) : undefined,
      agent: new https.Agent({ keepAlive: true }),
    });

    const text = await didRes.text();

    res.status(didRes.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
}
