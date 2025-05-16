export default async function handler(req, res) {
  const DID_API_KEY = process.env.DID_API_KEY;
  const url = `https://api.d-id.com${req.url.replace('/api/proxy-did', '')}`;

  const didRes = await fetch(url, {
    method: req.method,
    headers: {
      Authorization: `Basic ${DID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
  });

  const data = await didRes.json();
  res.status(didRes.status).json(data);
}
