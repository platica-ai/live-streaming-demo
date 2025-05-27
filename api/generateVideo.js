export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text in request body' });
  }

  const D_ID_KEY = process.env.DID_API_KEY;

  try {
    const didResponse = await fetch('https://api.d-id.com/talks', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${D_ID_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: {
          type: 'text',
          input: text,
          provider: {
            type: 'microsoft',
            voice_id: 'es-MX-DaliaNeural',
          },
          ssml: false,
        },
        config: {
          stitch: true,
        },
        source_url: 'https://tnbsunhhihibxaghyjnf.supabase.co/storage/v1/object/public/avatars/LUNA_DELGADO_PROFILE.jpeg',
      }),
    });

    const data = await didResponse.json();

    if (!didResponse.ok) {
      console.error('❌ D-ID Error:', data);
      return res.status(didResponse.status).json(data);
    }

    return res.status(200).json(data);

  } catch (err) {
    console.error('❌ Server error calling D-ID:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
