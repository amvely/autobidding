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
    // req.url 대신 req.query.path로 경로 재구성 (Vercel catch-all 라우팅)
    const pathParts = req.query.path || [];
    const queryParams = { ...req.query };
    delete queryParams.path; // path 파라미터 제거

    const queryString = Object.keys(queryParams).length
      ? '?' + new URLSearchParams(queryParams).toString()
      : '';

    const fullPath = '/' + pathParts.join('/') + queryString;

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
