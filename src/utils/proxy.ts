export const getProxyUrl = (url: string, isVideo: boolean = false): string => {
  if (!url) return url;
  
  // Se já estiver usando o proxy, não faz nada
  if (url.startsWith('/api-proxy') || url.startsWith('http') && url.includes('/api-proxy')) {
    return url;
  }

  const customProxy = import.meta.env.VITE_PROXY_URL;
  const isDev = import.meta.env.DEV;
  
  // Se for vídeo EM PRODUÇÃO, forçamos o proxy da Vercel (/api-proxy)
  // Se for vídeo em DESENVOLVIMENTO, o Vite já cuida do /api-proxy
  if (isVideo) {
    return `/api-proxy?url=${encodeURIComponent(url)}`;
  }

  // Para requisições de DADOS (listas) em produção:
  if (!isDev && customProxy) {
    return `${customProxy}${encodeURIComponent(url)}`;
  }

  // Padrão para desenvolvimento ou se não houver proxy customizado
  return `/api-proxy?url=${encodeURIComponent(url)}`;
};
