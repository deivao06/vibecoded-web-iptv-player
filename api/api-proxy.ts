import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url: targetUrl } = req.query;

  if (!targetUrl || typeof targetUrl !== 'string') {
    return res.status(400).send('Missing url parameter');
  }

  // SSRF Protection: Prevent localhost, 127.0.0.1 and private IPs
  try {
    const parsedUrl = new URL(targetUrl);
    const hostname = parsedUrl.hostname.toLowerCase();
    const isPrivate = hostname === 'localhost' || 
                      hostname === '127.0.0.1' || 
                      hostname === '0.0.0.0' || 
                      hostname.startsWith('192.168.') || 
                      hostname.startsWith('10.') || 
                      hostname.startsWith('172.16.');

    if (isPrivate) {
      return res.status(403).send('Forbidden: Private network access not allowed');
    }
  } catch {
    return res.status(400).send('Invalid URL');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout

    // Common browser headers to bypass simple bot detections
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
    };

    // Add optional credentials if it's an Xtream URL with Basic Auth (rare but possible)
    const parsedTarget = new URL(targetUrl);
    if (parsedTarget.username && parsedTarget.password) {
      const auth = Buffer.from(`${parsedTarget.username}:${parsedTarget.password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers
    });

    clearTimeout(timeoutId);

    // Set CORS headers early
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (!response.ok) {
      console.error(`Proxy: Target ${targetUrl} returned status ${response.status}`);
      // If the target returns 403, we return it but with a clear message
      return res.status(response.status).send(`IPTV Server returned ${response.status}. This usually means the provider blocks cloud hosting IPs (Vercel).`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    const data = await response.arrayBuffer();
    return res.send(Buffer.from(data));
  } catch (err: any) {
    if (err.name === 'AbortError') {
       return res.status(504).send('Proxy Timeout');
    }
    return res.status(500).send('Internal Proxy Error: ' + (err as Error).message);
  }
}
