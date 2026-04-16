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
    // 디버그: req.url과 req.query 전체 출력
    console.log('req.url:', req.url);
    console.log('req.query:', JSON.stringify(req.query));

    // req.query에서 path 제거하고 나머지 쿼리파라미터 추출
    const pathParts = Array.isArray(req.query.path)
      ? req.query.path
      : req.query.path ? [req.query.path] : [];

    const queryParams = { ...req.query };
    delete queryParams.path;

    const queryString = Object.keys(queryParams).length
      ? '?' + new URLSearchParams(queryParams).toString()
      : '';

    const fullPath = '/' + pathParts.join('/') + queryString;
    console.log('fullPath:', fullPath);

    const ts = Date.now().toString();
    const secretKey = (process.env.SECRET_KEY || '').trim();
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
        'X-API-KEY': (process.env.API_KEY || '').trim(),
        'X-Customer': (process.env.CUSTOMER_ID || '').trim(),
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
