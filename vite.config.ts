import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { Readable } from 'stream';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'm3u-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api-proxy')) {
            const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
            const targetUrl = urlParams.get('url');

            if (!targetUrl) {
              res.statusCode = 400;
              res.end('Missing url parameter');
              return;
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
                res.statusCode = 403;
                res.end('Forbidden: Private network access not allowed');
                return;
              }
            } catch {
              res.statusCode = 400;
              res.end('Invalid URL');
              return;
            }

            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => {
                try { controller.abort(); } catch (e) {}
              }, 180000); // 3 minutes timeout

              req.on('close', () => {
                clearTimeout(timeoutId);
                try {
                  if (!controller.signal.aborted) {
                    controller.abort();
                  }
                } catch (e) {
                  // Ignore abort errors on close
                }
              });

              const response = await fetch(targetUrl, {
                method: 'GET',
                redirect: 'follow',
                signal: controller.signal,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': 'text/plain, application/json, */*',
                  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
                }
              });

              clearTimeout(timeoutId);

              if (!response.ok) {
                console.error(`Proxy: Target returned ${response.status} for ${targetUrl}`);
                res.statusCode = response.status;
                res.end(`Target returned ${response.status}`);
                return;
              }

              // Set CORS headers
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
              
              const contentType = response.headers.get('content-type');
              if (contentType) {
                res.setHeader('Content-Type', contentType);
              }

              if (response.body) {
                // @ts-ignore
                const stream = Readable.fromWeb(response.body);
                
                // Trata erros no stream para evitar que o processo caia
                stream.on('error', (err: any) => {
                  if (err.code !== 'ABORT_ERR' && err.name !== 'AbortError') {
                    console.error('Proxy Stream Error:', err.message);
                  }
                  if (!res.writableEnded) res.end();
                });

                stream.pipe(res);
              } else {
                res.end();
              }
              return;
            } catch (err: any) {
              if (err.name === 'AbortError') {
                 console.error('Proxy Timeout:', targetUrl);
                 res.statusCode = 504;
                 res.end('Proxy Timeout');
                 return;
              }
              console.error('Proxy Error:', err);
              if (!res.headersSent) {
                res.statusCode = 500;
                res.end('Internal Proxy Error: ' + (err as Error).message);
              }
              return;
            }
          }
          next();
        });
      }
    }
  ]
})
