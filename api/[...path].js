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
    // path 배열로 경로 조합
    const pathParts = Array.isArray(req.query.path)
      ? req.query.path
      : [req.query.path].filter(Boolean);

    const basePath = '/' + pathParts.join('/');

    // path 제외한 나머지 쿼리스트링
    const query = Object.assign({}, req.query);
    delete query.path;
    const qs = new URLSearchParams(query).toString();
    const fullPath = qs ? `${basePath}?${qs}` : basePath;

    console.log('fullPath:', fullPath); // 로그 확인용

    // HMAC-SHA256 서명
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
    console.log('naver response:', text); // 로그 확인용

    try {
      const data = JSON.parse(text);
      res.status(response.status).json(data);
    } catch (e) {
      res.status(response.status).send(text);
    }

  } catch (err) {
    console.error('error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
