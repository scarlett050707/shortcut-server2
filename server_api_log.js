// api/log.js
// iOS快捷指令调用这个接口上报App活动
// 支持 GET /api/log?app=小红书  （最简单，快捷指令直接用URL请求）
// 支持 POST /api/log  body: { appName: "小红书" }

const { kv } = require('@vercel/kv');

export default async function handler(req, res) {
  // 允许跨域（网页轮询需要）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // 获取 appName
  let appName = req.query.app || req.query.appName;
  if (!appName && req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      appName = body?.appName || body?.app;
    } catch(e) {}
  }

  if (!appName) {
    return res.status(400).json({ error: 'appName required. Use ?app=小红书 or POST {appName:"小红书"}' });
  }

  const event = {
    appName: String(appName).slice(0, 50),
    timestamp: Date.now(),
  };

  // 存入 KV，key = event:时间戳，TTL = 7天
  try {
    await kv.set(`event:${event.timestamp}`, JSON.stringify(event), { ex: 60 * 60 * 24 * 7 });
  } catch(e) {
    console.error('KV write error:', e);
    return res.status(500).json({ error: 'Storage failed', detail: e.message });
  }

  console.log('[log]', event);
  return res.status(200).json({ ok: true, received: event });
}
