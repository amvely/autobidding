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
    const pathParts = req.query.path || [];
    const basePath = '/' + pathParts.join('/');
    const query = { ...req.query };
    delete query.path;
    const queryString = new URLSearchParams(query).toString();
    const fullPath = queryString ? `${basePath}?${queryString}` : basePath;

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
    const data = await response.json();
    res.status(response.status).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
