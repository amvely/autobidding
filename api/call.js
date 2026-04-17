const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  try {
    // path와 body를 POST body에서 받음
    const { path, method: naverMethod, body: naverBody } = req.body || {};
    const fullPath = path || '';
    const method = naverMethod || 'GET';

    // 서명은 ? 앞 path만 사용
    const signPath = fullPath.split('?')[0];

    const ts = Date.now().toString();
    const sig = crypto
      .createHmac('sha256', (process.env.SECRET_KEY || '').trim())
      .update(`${ts}.${method}.${signPath}`)
      .digest('base64');

    const fetchOpts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Timestamp': ts,
        'X-API-KEY': (process.env.API_KEY || '').trim(),
        'X-Customer': (process.env.CUSTOMER_ID || '').trim(),
        'X-Signature': sig,
      },
    };

    if (naverBody) fetchOpts.body = JSON.stringify(naverBody);

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
