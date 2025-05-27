export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log("🔍 Incoming body:", req.body); // ⬅️ Add this

  const D_ID_KEY = process.env.DID_API_KEY;

  try {
    const didRes = await fetch('https://api.d-id.com/talks/streams', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${D_ID_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
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
