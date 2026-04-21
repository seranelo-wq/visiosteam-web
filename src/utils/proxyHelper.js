export function getProxiedUrl(originalUrl) {
  // Usa un proxy público para evitar CORS. Cambia por tu propio worker si es necesario.
  return `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`;
}
