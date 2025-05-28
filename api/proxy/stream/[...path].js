export default async function handler(req, res) {
  const { path = [] } = req.query;
  const method = req.method;

  const D_ID_KEY = process.env.DID_API_KEY;

  // Build D-ID target URL
  const endpoint = `https://api.d-id.com/talks/streams/${path.join('/')}`;

  try {
    const didRes = await fetch(endpoint, {
      method,
      headers: {
        Authorization: `Basic ${D_ID_KEY}`,
        'Content-Type': 'application/json',
      },
      body: method === 'GET' ? undefined : JSON.stringify(req.body),
    });

    const data = await didRes.json();

    if (!didRes.ok) {
      return res.status(didRes.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error', details: err.message });
  }
}
