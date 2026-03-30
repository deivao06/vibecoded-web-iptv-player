import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const targetUrl = new URL(url);
    
    // Headers para simular um navegador real e evitar 403 de CDNs
    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Connection': 'keep-alive',
      'Referer': targetUrl.origin + '/',
      'Origin': targetUrl.origin,
    };

    // Se o cliente (browser) enviou Range, nós repassamos para o servidor de IPTV (importante para seek de vídeo)
    if (req.headers.range) {
      headers['Range'] = req.headers.range as string;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
      redirect: 'follow',
    });

    // Se o servidor retornar 403 ou erro, logamos para debug
    if (!response.ok) {
      console.error(`Proxy Error: Server returned ${response.status} for ${url}`);
      return res.status(response.status).send(`Target server returned ${response.status}`);
    }

    // Repassa os headers críticos de conteúdo e streaming
    const forwardHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'expires'
    ];

    forwardHeaders.forEach(h => {
      const value = response.headers.get(h);
      if (value) res.setHeader(h, value);
    });

    // CORS - Permitir que o seu app web leia o stream
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (!response.body) {
      return res.end();
    }

    // Pipeline de stream para a resposta da Vercel
    // @ts-ignore
    const reader = response.body.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    
    res.end();
  } catch (error: any) {
    console.error('Vercel Proxy Critical Error:', error);
    if (!res.headersSent) {
      res.status(500).send('Proxy Critical Error: ' + error.message);
    }
  }
}
