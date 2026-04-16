const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const naverPath = req.query.p || '';
    const ts = Date.now().toString();
    const secretKey = (process.env.SECRET_KEY || '').trim();
    const sig = crypto
      .createHmac('sha256', secretKey)
      .update(`${ts}.${req.method}.${naverPath}`)
      .digest('base64');

    const fetchOpts = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Timestamp': ts,
        'X-API-KEY': (process.env.API_KEY || '').trim(),
        'X-Customer': (process.env.CUSTOMER_ID || '').trim(),
        'X-Signature': sig,
      },
    };

    if (req.body && req.method !== 'GET') {
      fetchOpts.body = JSON.stringify(req.body);
    }

    const response = await fetch(`https://api.searchad.naver.com${naverPath}`, fetchOpts);
    const text = await response.text();

    try {
      res.status(response.status).json(JSON.parse(text));
    } catch {
      res.status(response.status).send(text);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
