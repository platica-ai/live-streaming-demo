import https from 'https';

export async function GET(req, { params }) {
  return proxyRequest(req, 'GET', params);
}

export async function POST(req, { params }) {
  return proxyRequest(req, 'POST', params);
}

async function proxyRequest(req, method, params) {
  const targetPath = params.path.join('/');
  const proxyUrl = `https://api.d-id.com/${targetPath}`;

  const body = method !== 'GET' && method !== 'HEAD' ? await req.text() : undefined;

  try {
    const proxyRes = await fetch(proxyUrl, {
      method,
      headers: {
        Authorization: process.env.DID_API_KEY, // ✅ no "Basic " prefix here
        'Content-Type': 'application/json',
      },
      body,
      agent: new https.Agent({ keepAlive: true }),
    });

    const text = await proxyRes.text();

    return new Response(text, {
      status: proxyRes.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Proxy failed', details: error.message }), {
      status: 500,
    });
  }
}
