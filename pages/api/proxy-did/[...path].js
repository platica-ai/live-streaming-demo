export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const { path = [] } = req.query;
  const method = req.method;

  let rawBody = '';
  try {
    rawBody = await new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => (body += chunk.toString()));
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });
  } catch (e) {
    console.error('❌ Failed to read request body:', e);
    return res.status(400).json({ error: 'Failed to read request body' });
  }

  let jsonBody = {};
  if (rawBody) {
    try {
      jsonBody = JSON.parse(rawBody);
    } catch (e) {
      console.error('❌ Invalid JSON body:', rawBody);
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  const D_ID_KEY = process.env.DID_API_KEY;
  const endpoint = `https://api.d-id.com/talks/${path.join('/')}`;

  try {
    const didRes = await fetch(endpoint, {
      method,
      headers: {
        Authorization: `Basic ${D_ID_KEY}`,
        'Content-Type': 'application/json',
      },
      body: method === 'GET' ? undefined : JSON.stringify(jsonBody),
    });

    const data = await didRes.json();

    if (!didRes.ok) {
      console.error('❌ D-ID API error:', data);
      return res.status(didRes.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('❌ Server error in proxy:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
