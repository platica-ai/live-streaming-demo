export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
  const targetPath = req.query.path.join('/');
  const proxyUrl = `https://api.d-id.com/${targetPath}`;

  const headers = {
    'Authorization': `Basic ${process.env.DID_API_KEY}`,
    'Content-Type': req.headers['content-type'] || 'application/json',
  };

  const proxyRes = await fetch(proxyUrl, {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : req,
  });

  const text = await proxyRes.text();
  res.status(proxyRes.status).send(text);
}
