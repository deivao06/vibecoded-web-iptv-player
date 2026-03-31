export const getProxyUrl = (url: string, _isVideo: boolean = false): string => {
  if (!url) return url;
  
  // Se já estiver usando o proxy, não faz nada
  if (url.startsWith('/api-proxy') || (url.startsWith('http') && url.includes('/api-proxy'))) {
    return url;
  }

  // Se houver um proxy customizado via variável de ambiente, usamos ele
  const customProxy = import.meta.env.VITE_PROXY_URL;
  if (customProxy) {
    return `${customProxy}${encodeURIComponent(url)}`;
  }

  // Padrão para self-hosted: usar o endpoint local configurado no servidor (Vite ou Node)
  return `/api-proxy?url=${encodeURIComponent(url)}`;
};
