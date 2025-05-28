export default async function handler(req, res) {
  const { id } = req.query;

  const response = await fetch(`https://api.d-id.com/talks/streams/${id}`, {
    method: req.method,
    headers: {
      'Authorization': `Basic ${process.env.DID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: req.method === 'GET' ? undefined : JSON.stringify(req.body),
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(response.status).json(data);
  }

  res.status(200).json(data);
}
