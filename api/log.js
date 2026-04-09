// api/log.js
// 快捷指令调用这个接口，告诉服务器你打开了哪个App
// 用法超简单：在Safari或快捷指令里访问
// https://你的域名.vercel.app/api/log?app=小红书

import { put, list, del } from '@vercel/blob';

export default async function handler(req, res) {
  // 允许网页跨域访问
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // 获取App名字（支持两种方式传入）
  let appName = req.query.app || req.query.appName;
  if (!appName && req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      appName = body?.appName || body?.app;
    } catch(e) {}
  }

  if (!appName) {
    return res.status(400).json({ 
      error: '需要告诉我App名字！',
      用法: '在网址后面加 ?app=小红书 就行了'
    });
  }

  const ts = Date.now();
  const event = { appName: String(appName).slice(0, 50), timestamp: ts };

  try {
    // 把这条活动记录存成一个小文件
    // 文件名格式：events/时间戳.json
    await put(
      `events/${ts}.json`,
      JSON.stringify(event),
      { access: 'public', addRandomSuffix: false }
    );

    // 顺便清理7天前的旧记录（不清理也没事，只是省空间）
    const cutoff = ts - 7 * 24 * 60 * 60 * 1000;
    try {
      const old = await list({ prefix: 'events/' });
      const toDelete = (old.blobs || []).filter(b => {
        const fileTs = parseInt(b.pathname.replace('events/', '').replace('.json', ''));
        return fileTs < cutoff;
      });
      await Promise.all(toDelete.map(b => del(b.url)));
    } catch(e) { /* 清理失败不影响主流程 */ }

    console.log('[记录]', event);
    return res.status(200).json({ ok: true, received: event });

  } catch(e) {
    console.error('存储失败:', e);
    return res.status(500).json({ error: '存储失败', detail: e.message });
  }
}
