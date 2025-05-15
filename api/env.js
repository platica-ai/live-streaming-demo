export default function handler(req, res) {
  res.status(200).json({
    DID_API_KEY: process.env.DID_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  });
}
