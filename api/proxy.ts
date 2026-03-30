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
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
      }
    });

    // Repassar Headers de CORS e permitir tudo para o browser
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (!response.ok) {
      console.error(`Proxy: Target ${targetUrl} returned status ${response.status}`);
      // Se o alvo retornar 403, repassamos mas com uma mensagem clara para debug
      return res.status(response.status).send(`IPTV Server returned ${response.status}. This usually means the provider blocks cloud hosting IPs (Vercel).`);
    }

    // Nota: Para vídeos grandes, isso pode falhar na Vercel devido ao limite de payload/timeout.
    // Mas funciona bem para manifestos .m3u8 e pequenos segmentos.
    const data = await response.arrayBuffer();
    return res.send(Buffer.from(data));

  } catch (error: any) {
    return res.status(500).send('Proxy Error: ' + error.message);
  }
}
