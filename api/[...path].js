const crypto = require('crypto');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Timestamp, X-API-KEY, X-Customer, X-Signature');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // req.url 방식으로 경로 추출
    const rawUrl = req.url || '';
    const qIdx = rawUrl.indexOf('?');
    const rawPath = qIdx >= 0 ? rawUrl.slice(0, qIdx) : rawUrl;
    const rawQuery = qIdx >= 0 ? rawUrl.slice(qIdx) : '';

    const cleanPath = rawPath.replace(/^\/api/, '') || '/';
    const fullPath = cleanPath + rawQuery;

    console.log('req.url:', rawUrl);
    console.log('fullPath:', fullPath);

    const ts = Date.now().toString();
    const secretKey = (process.env.SECRET_KEY || '').trim();
    const apiKey = (process.env.API_KEY || '').trim();
    const customerId = (process.env.CUSTOMER_ID || '').trim();

    const signMessage = `${ts}.${req.method}.${fullPath}`;
    console.log('signMessage:', signMessage);

    const sig = crypto
      .createHmac('sha256', secretKey)
      .update(signMessage)
      .digest('base64');

    const fetchOpts = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'X-Timestamp': ts,
        'X-API-KEY': apiKey,
        'X-Customer': customerId,
        'X-Signature': sig,
      },
    };

    if (req.body && req.method !== 'GET') {
      fetchOpts.body = JSON.stringify(req.body);
    }

    const apiUrl = `https://api.searchad.naver.com${fullPath}`;
    console.log('calling:', apiUrl);

    const response = await fetch(apiUrl, fetchOpts);
    const text = await response.text();
    console.log('naver response:', response.status, text.slice(0, 300));

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
