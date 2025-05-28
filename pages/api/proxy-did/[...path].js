export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const { method, headers } = req;
  const path = req.query.path.join('/');
  const proxyUrl = `https://api.d-id.com/${path}`;

  try {
    const proxyResponse = await fetch(proxyUrl, {
      method,
      headers: {
        'Authorization': `Basic ${process.env.DID_API_KEY}`,
        'Content-Type': headers['content-type'] || 'application/json',
      },
      body: method !== 'GET' && method !== 'HEAD' ? req : undefined,
    });

    res.status(proxyResponse.status);
    proxyResponse.body.pipe(res);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy error', details: error.message });
  }
}
