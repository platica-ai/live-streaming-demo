export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    const targetPath = req.query.path.join('/');
    const proxyUrl = `https://api.d-id.com/${targetPath}`;

    const method = req.method;

    let body = undefined;
    if (method !== 'GET' && method !== 'HEAD') {
      body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => {
          data += chunk;
        });
        req.on('end', () => {
          resolve(data);
        });
        req.on('error', err => {
          reject(err);
        });
      });
    }

    const proxyRes = await fetch(proxyUrl, {
      method,
      headers: {
        'Authorization': `Basic ${process.env.DID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    const result = await proxyRes.text();
    res.status(proxyRes.status).send(result);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Internal Server Error');
  }
}
