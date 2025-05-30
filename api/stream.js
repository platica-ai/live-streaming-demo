export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const response = await fetch('https://api.d-id.com/talks/streams', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${process.env.DID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json(data);
  }

  res.status(200).json(data);
}
