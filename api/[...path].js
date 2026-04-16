const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Naver-Path');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    // HTML이 X-Naver-Path 헤더로 네이버 경로를 그대로 전달
    const fullPath = req.headers['x-naver-path'] || '';

    const ts = Date.now().toString();
    const sig = crypto
      .createHmac('sha256', (process.env.SECRET_KEY || '').trim())
      .update(`${ts}.${req.method}.${fullPath}`)
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

    const response = await fetch(`https://api.searchad.naver.com${fullPath}`, fetchOpts);
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
