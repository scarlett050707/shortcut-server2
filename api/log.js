export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { appName, action, timestamp } = req.body;
  
  console.log('收到记录:', { appName, action, timestamp });
  
  return res.status(200).json({ 
    success: true, 
    message: '记录成功',
    data: { appName, action, timestamp }
  });
}
