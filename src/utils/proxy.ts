export const getProxyUrl = (url: string, _isVideo: boolean = false): string => {
  if (!url) return url;
  
  // Se já for uma URL absoluta do proxy, não faz nada
  if (url.startsWith('http') && url.includes('/api-proxy')) {
    return url;
  }

  // Se houver um proxy customizado via variável de ambiente, usamos ele
  const customProxy = import.meta.env.VITE_PROXY_URL;
  if (customProxy) {
    return `${customProxy}${encodeURIComponent(url)}`;
  }

  // Padrão para self-hosted: usar o endpoint local.
  // IMPORTANTE: Usamos window.location.origin para garantir que a URL seja ABSOLUTA.
  // Isso evita erros em Web Workers (usados pelo mpegts.js) que não resolvem caminhos relativos.
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}/api-proxy?url=${encodeURIComponent(url)}`;
};
