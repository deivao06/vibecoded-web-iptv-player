import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url: targetUrl } = req.query;

  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const parsedUrl = new URL(targetUrl);
    
    // Proteção básica contra SSRF
    const hostname = parsedUrl.hostname.toLowerCase();
    const isPrivate = hostname === 'localhost' || 
                      hostname === '127.0.0.1' || 
                      hostname.startsWith('192.168.') || 
                      hostname.startsWith('10.') || 
                      hostname.startsWith('172.');

    if (isPrivate) {
      return res.status(403).send('Forbidden: Private network access not allowed');
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    });

    // Repassar Headers de CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // Nota: Para vídeos grandes, isso pode falhar na Vercel devido ao limite de payload/timeout.
    // Mas funciona bem para manifestos .m3u8 e pequenos segmentos.
    const data = await response.arrayBuffer();
    return res.send(Buffer.from(data));

  } catch (error: any) {
    return res.status(500).send('Proxy Error: ' + error.message);
  }
}
