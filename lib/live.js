export function parseLive(settings) {
  if (!settings || typeof settings.url !== 'string' || typeof settings.isLive !== 'boolean') {
    throw new Error('live.json의 url과 isLive 값을 확인해 주세요.');
  }
  const url = new URL(settings.url);
  if (url.protocol !== 'https:' || url.username || url.password || url.port
    || !['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(url.hostname)) {
    throw new Error('생방송 주소는 https://로 시작하는 유튜브 주소여야 합니다.');
  }
  return { url: url.href, isLive: settings.isLive };
}
