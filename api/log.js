import fs from 'fs';
const FILE = '/tmp/events.json';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const appName = req.query.app || req.query.appName;
  if (!appName) return res.status(400).json({ error: '请加上 ?app=App名字' });

  let events = [];
  try { events = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch(e) {}

  const event = { appName: String(appName).slice(0, 50), timestamp: Date.now() };
  events.push(event);
  if (events.length > 200) events.splice(0, events.length - 200);
  fs.writeFileSync(FILE, JSON.stringify(events));

  return res.status(200).json({ ok: true, received: event });
}
