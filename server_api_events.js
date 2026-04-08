// api/events.js
// 网页轮询这个接口，获取 since 时间戳之后的所有事件
// GET /api/events?since=1712345678000

const { kv } = require('@vercel/kv');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const since = parseInt(req.query.since) || (Date.now() - 60 * 60 * 1000); // 默认取最近1小时

  try {
    // 扫描所有 event: 开头的 key
    const keys = await kv.keys('event:*');
    if (!keys || keys.length === 0) return res.status(200).json([]);

    // 过滤 since 之后的事件
    const filtered = keys
      .map(k => parseInt(k.replace('event:', '')))
      .filter(ts => ts > since)
      .sort((a, b) => a - b);

    if (filtered.length === 0) return res.status(200).json([]);

    // 批量读取
    const values = await Promise.all(
      filtered.map(ts => kv.get(`event:${ts}`))
    );

    const events = values
      .map(v => {
        try { return typeof v === 'string' ? JSON.parse(v) : v; } catch(e) { return null; }
      })
      .filter(Boolean);

    return res.status(200).json(events);
  } catch(e) {
    console.error('KV read error:', e);
    return res.status(500).json({ error: e.message });
  }
}
