import fs from 'fs';
const FILE = '/tmp/events.json';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let events = [];
  try { events = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch(e) {}

  const since = parseInt(req.query.since) || (Date.now() - 3600000);
  const result = events.filter(e => e.timestamp > since);
  return res.status(200).json(result);
}
