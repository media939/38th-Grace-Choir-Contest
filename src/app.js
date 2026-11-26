import { slots as defaultSlots, parseVideos } from './festival.js';
import { parseLive } from './live.js';
const $ = id => document.getElementById(id);
let slots = defaultSlots, expanded = false;
const create = (tag, cls, text) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text) el.textContent = text;
  return el;
};
function view(el, vertical) {
  $('media').replaceChildren(el);
  $('viewer').classList.toggle('short', !!vertical);
  $('viewer').showModal();
}
$('close').onclick = () => $('viewer').close();
$('viewer').onclose = () => $('media').replaceChildren();
function play(slot) {
  if (slot.youtube) {
    const frame = create('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/' + slot.youtube + '?autoplay=1';
    frame.title = slot.name;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture';
    frame.allowFullscreen = true;
    const panel = create('div');
    const link = create('a', 'btn outline', 'YouTube에서 보기');
    link.href = 'https://www.youtube.com/watch?v=' + slot.youtube;
    link.target = '_blank'; link.rel = 'noopener';
    panel.append(frame, link);
    view(panel, slot.kind === 'short');
  }
}
function card(slot) {
  const ready = slot.youtube;
  const el = create(ready ? 'button' : 'article', 'card');
  el.append(create('span','cover',ready?'▶':'♫'));
  const copy = create('span','copy');
  copy.append(create('strong','',slot.name), create('small','',slot.song || (ready?'영상 재생':'영상 준비 중')));
  el.append(copy);
  if (ready) el.onclick = () => play(slot);
  return el;
}
function render() {
  const filter = $('filter').value, query = $('search').value.trim().toLowerCase();
  const groups = slots.filter(s => s.kind !== 'full' && s.kind !== 'short'
    && (!filter || s.kind === filter || (filter === 'ready' && (s.youtube)))
    && (s.name + ' ' + s.song).toLowerCase().includes(query));
  const compact = !filter && !query;
  $('group-grid').replaceChildren(...(expanded || !compact ? groups : groups.slice(0,8)).map(card));
  $('expand').hidden = !compact;
  $('expand').textContent = expanded ? '참가팀 접기' : '30개 참가팀 모두 보기';
  $('load-state').textContent = groups.length ? '' : '표시할 영상이 없습니다.';
  $('short-grid').replaceChildren(...slots.filter(s=>s.kind==='short').map(card));
  const full = slots.find(s=>s.kind==='full');
  $('full-name').textContent = full.name;
  $('full-state').textContent = full.song || (full.youtube ? '전체 공연 다시보기' : '영상 준비 중');
  $('full-play').hidden = !full.youtube;
  $('full-play').onclick = () => play(full);
}
function renderLive(settings) {
  const button = $('live-button');
  button.href = settings.url;
  button.classList.toggle('is-live', settings.isLive);
  button.setAttribute('aria-label', settings.isLive
    ? '생방송 중 · 생방송 보기 (YouTube 새 창)'
    : '생방송 보기 (YouTube 새 창)');
  $('live-status').hidden = !settings.isLive;
}
async function refreshLive() {
  try {
    const response = await fetch('/live.json', {cache:'no-store'});
    if (!response.ok) throw Error('생방송 상태를 불러올 수 없습니다.');
    renderLive(parseLive(await response.json()));
  } catch {
    // 상태를 확인할 수 없으면 링크를 유지하고 생방송 중 표시는 끕니다.
    renderLive({url:$('live-button').href, isLive:false});
  }
}
async function start() {
  refreshLive();
  setInterval(() => { if (!document.hidden) refreshLive(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshLive(); });
  for (let i=0;i<5;i++) {
    const button = create('button');
    const photo = create('img');
    photo.src = '/photo/' + i + '.jpg'; photo.loading = 'lazy'; photo.alt = '2025년 제37회 은혜성가제 현장 사진 ' + (i+1);
    button.append(photo); button.onclick = () => view(photo.cloneNode());
    $('photos').append(button);
  }
  $('filter').onchange = render; $('search').oninput = render;
  $('expand').onclick = () => {expanded = !expanded; render();};
  render();
  try {
    const response = await fetch('/videos.json', {cache:'no-store'});
    if (!response.ok) throw Error('영상 목록을 불러올 수 없습니다.');
    slots = parseVideos(await response.json());
    render();
  }
  catch { $('load-state').textContent = '영상 목록을 불러오지 못했습니다. 페이지를 새로고침해 주세요.'; }
}
start();
