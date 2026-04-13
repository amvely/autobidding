const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const url = new URL(req.url, 'https://dummy.com');
    const fullPath = url.pathname.replace(/^\/api/, '') + (url.search || '');

    console.log('fullPath:', fullPath);

    const ts = Date.now().toString();
    const sig = crypto
      .createHmac('sha256', process.env.SECRET_KEY)
      .update(`${ts}.${req.method}.${fullPath}`)
      .digest('base64');

    const fetchOpts = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Timestamp': ts,
        'X-API-KEY': process.env.API_KEY,
        'X-Customer': process.env.CUSTOMER_ID,
        'X-Signature': sig,
      },
    };

    if (req.body && req.method !== 'GET') {
      fetchOpts.body = JSON.stringify(req.body);
    }

    const response = await fetch(
      `https://api.searchad.naver.com${fullPath}`,
      fetchOpts
    );

    const text = await response.text();
    console.log('naver response:', response.status, text.slice(0, 200));

    try {
      res.status(response.status).json(JSON.parse(text));
    } catch {
      res.status(response.status).send(text);
    }

  } catch (err) {
    console.error('error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
