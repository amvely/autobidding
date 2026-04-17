const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    const { path, method: naverMethod, body: naverBody, apiKey, secretKey, customerId } = req.body || {};
    const fullPath = path || '';
    const method   = naverMethod || 'GET';
    const signPath = fullPath.split('?')[0];

    // UI에서 넘긴 키 우선, 없으면 환경변수 fallback
    const ak  = (apiKey     || process.env.API_KEY     || '').trim();
    const sk  = (secretKey  || process.env.SECRET_KEY  || '').trim();
    const cid = (customerId || process.env.CUSTOMER_ID || '').trim();

    if (!ak || !sk || !cid) {
      return res.status(400).json({ error: 'API 키, 시크릿 키, 고객 ID가 필요합니다.' });
    }

    const ts  = Date.now().toString();
    const sig = crypto
      .createHmac('sha256', sk)
      .update(`${ts}.${method}.${signPath}`)
      .digest('base64');

    const fetchOpts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Timestamp':  ts,
        'X-API-KEY':    ak,
        'X-Customer':   cid,
        'X-Signature':  sig,
      },
    };

    if (naverBody) fetchOpts.body = JSON.stringify(naverBody);

    const response = await fetch(`https://api.searchad.naver.com${fullPath}`, fetchOpts);
    const text     = await response.text();

    try {
      res.status(response.status).json(JSON.parse(text));
    } catch {
      res.status(response.status).send(text);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
