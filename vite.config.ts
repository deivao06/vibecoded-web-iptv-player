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

            try {
              console.log(`[Proxy] Requesting: ${targetUrl}`);
              const controller = new AbortController();
              const timeoutId = setTimeout(() => {
                try { controller.abort(); } catch (e) {}
              }, 30000); // Reduzido para 30s para falhar mais rápido se houver problema

              req.on('close', () => {
                clearTimeout(timeoutId);
                try {
                  if (!controller.signal.aborted) controller.abort();
                } catch (e) {}
              });

              const response = await fetch(targetUrl, {
                method: 'GET',
                redirect: 'follow',
                signal: controller.signal,
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Accept': '*/*',
                }
              });

              clearTimeout(timeoutId);

              if (!response.ok) {
                console.error(`[Proxy] Target returned ${response.status} for ${targetUrl}`);
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
                stream.on('error', (err) => {
                  console.error('[Proxy] Stream Error:', err.message);
                  if (!res.writableEnded) res.end();
                });
                stream.pipe(res);
              } else {
                res.end();
              }
              return;
            } catch (err: any) {
              console.error('[Proxy] Critical Error:', err.message);
              if (err.name === 'AbortError') {
                 res.statusCode = 504;
                 res.end('Proxy Timeout');
                 return;
              }
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
