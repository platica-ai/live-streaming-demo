export default async function handler(req, res) {
  const proxyRes = await fetch('https://api.d-id.com/talks', {
    headers: {
      Authorization: `Basic Z2FicmllbEBzY3BsYXRpY2EuY29t:Lls2nIIRuimObDui0KC7S`,
    },
  });

  const data = await proxyRes.text();
  res.status(200).send(data);
}
