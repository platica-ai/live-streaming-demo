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

  const body = method !== 'GET' && method !== 'HEAD' ? req.body : undefined;
  const headers = new Headers(req.headers);

  // Always overwrite authorization with env key
  headers.set('Authorization', process.env.DID_API_KEY);

  try {
    const proxyRes = await fetch(proxyUrl, {
      method,
      headers,
      body,
      redirect: 'follow',
      agent: new https.Agent({ keepAlive: true }),
    });

    const contentType = proxyRes.headers.get('content-type') || 'application/json';
    const text = await proxyRes.text();

    return new Response(text, {
      status: proxyRes.status,
      headers: {
        'Content-Type': contentType,
      },
    });
  } catch (error) {
    console.error('❌ Proxy error:', error);
    return new Response(JSON.stringify({ error: 'Proxy failed', details: error.message }), {
      status: 500,
    });
  }
}
