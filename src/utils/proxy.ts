export const getProxyUrl = (url: string): string => {
  if (!url) return url;
  
  // Se já estiver usando o proxy, não faz nada
  if (url.startsWith('/api-proxy') || url.startsWith('http') && url.includes('/api-proxy')) {
    return url;
  }

  const customProxy = import.meta.env.VITE_PROXY_URL;
  
  if (!customProxy) {
    // Para Vercel (Prod) e Vite (Dev), usamos o prefixo relativo
    return `/api-proxy?url=${encodeURIComponent(url)}`;
  } else {
    // Se houver uma URL de proxy customizada (ex: Cloudflare Worker)
    return `${customProxy}${encodeURIComponent(url)}`;
  }
};
