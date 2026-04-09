// api/events.js  
// 网页自动来这里取最新的App活动记录
// 不需要你手动操作，网页自己会定时来取

import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const since = parseInt(req.query.since) || (Date.now() - 60 * 60 * 1000);

  try {
    // 列出所有活动记录文件
    const result = await list({ prefix: 'events/' });
    const blobs = result.blobs || [];

    // 只要 since 之后的
    const recent = blobs
      .map(b => ({
        ts: parseInt(b.pathname.replace('events/', '').replace('.json', '')),
        url: b.url
      }))
      .filter(b => b.ts > since)
      .sort((a, b) => a.ts - b.ts)
      .slice(-50); // 最多返回50条

    if (recent.length === 0) {
      return res.status(200).json([]);
    }

    // 读取每个文件的内容
    const events = await Promise.all(
      recent.map(async b => {
        try {
          const r = await fetch(b.url);
          const data = await r.json();
          return data;
        } catch(e) { return null; }
      })
    );

    return res.status(200).json(events.filter(Boolean));

  } catch(e) {
    console.error('读取失败:', e);
    return res.status(500).json({ error: e.message });
  }
}
