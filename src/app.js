import { upload } from '@vercel/blob/client';
import { slots as defaultSlots } from '../lib/festival.js';
const $ = id => document.getElementById(id);
let slots = defaultSlots, expanded = false;
const admin = location.pathname.replace(/\/$/, '') === '/admin';
const create = (tag, cls, text) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text) el.textContent = text;
  return el;
};
async function api(path, method = 'GET', data) {
  const binary = data instanceof Blob;
  const response = await fetch(path, {
    method,
    headers: data && !binary ? {'Content-Type':'application/json'} : {},
    body: data ? (binary ? data : JSON.stringify(data)) : undefined
  });
  if (response.redirected) throw Error('사이트 소유자 계정으로 다시 로그인해 주세요.');
  const result = await response.json();
  if (!response.ok) throw Error(result.error);
  return result;
}
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
  } else {
    const video = create('video');
    video.src = slot.videoUrl;
    video.controls = true; video.autoplay = true; video.playsInline = true;
    view(video, slot.kind === 'short');
  }
}
function card(slot) {
  const ready = slot.youtube || slot.file;
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
    && (!filter || s.kind === filter || (filter === 'ready' && (s.youtube || s.file)))
    && (s.name + ' ' + s.song).toLowerCase().includes(query));
  const compact = !filter && !query;
  $('group-grid').replaceChildren(...(expanded || !compact ? groups : groups.slice(0,8)).map(card));
  $('expand').hidden = !compact;
  $('expand').textContent = expanded ? '참가팀 접기' : '30개 참가팀 모두 보기';
  $('load-state').textContent = groups.length ? '' : '표시할 영상이 없습니다.';
  $('short-grid').replaceChildren(...slots.filter(s=>s.kind==='short').map(card));
  const full = slots.find(s=>s.kind==='full');
  $('full-name').textContent = full.name;
  $('full-state').textContent = full.song || (full.youtube || full.file ? '전체 공연 다시보기' : '영상 준비 중');
  $('full-play').hidden = !full.youtube && !full.file;
  $('full-play').onclick = () => play(full);
}
function fillEditor() {
  const slot = slots.find(s=>s.id===$('slot').value);
  $('name').value = slot.name;
  $('song').value = slot.song;
  $('url').value = slot.youtube ? 'https://www.youtube.com/watch?v=' + slot.youtube : '';
  $('file').value = '';
  $('remove').disabled = !slot.youtube && !slot.file;
}
async function refreshEditor(selected) {
  slots = await api('/api/videos');
  const select = $('slot');
  select.replaceChildren();
  for (const [title, kinds] of [['참가팀 영상 · 30개',['group','em','gmi']],['전체 영상 · 1개',['full']],['Shorts · 5개',['short']]]) {
    const group = create('optgroup'); group.label = title;
    for (const s of slots.filter(s=>kinds.includes(s.kind))) {
      const option = create('option','',s.name + (s.youtube || s.file ? ' · 등록 완료' : ' · 미등록'));
      option.value = s.id; group.append(option);
    }
    select.append(group);
  }
  if (selected) select.value = selected;
  fillEditor();
}
function busy(active) {
  for (const id of ['slot','name','song','url','file']) $(id).disabled = active;
  $('editor').querySelector('[type=submit]').disabled = active;
  const slot = slots.find(s=>s.id===$('slot').value);
  $('remove').disabled = active || !slot || (!slot.youtube && !slot.file);
}
$('editor').onsubmit = async event => {
  event.preventDefault();
  const id = $('slot').value;
  const file = $('file').files[0];
  const current = slots.find(s=>s.id===id);
  const fields = {name:$('name').value,song:$('song').value,url:$('url').value,revision:current.revision};
  let uploaded;
  busy(true);
  $('save-state').textContent = '저장하고 있습니다.';
  try {
    if (!file) {
      const current = slots.find(s=>s.id===id);
      await api('/api/slot/' + id, 'PUT', {...fields,keep:!fields.url && !current.youtube});
    } else {
      const type = file.type || (file.name.toLowerCase().endsWith('.mp4') ? 'video/mp4' : 'video/webm');
      if (!['video/mp4','video/webm'].includes(type) || file.size > 10 * 1024 ** 3 || file.size === 0) throw Error('10GB 이하의 MP4 또는 WebM 영상을 선택해 주세요.');
      $('progress').hidden = false; $('progress').value = 0;
      const extension = type === 'video/mp4' ? 'mp4' : 'webm';
      uploaded = await upload('videos/' + id + '/' + crypto.randomUUID() + '.' + extension, file, {
        access:'public',handleUploadUrl:'/api/upload',multipart:true,contentType:type,
        onUploadProgress:({percentage}) => { $('progress').value = percentage; $('save-state').textContent = '영상 업로드 중 · ' + Math.round(percentage) + '%'; }
      });
      await api('/api/slot/' + id, 'PUT', {...fields,pathname:uploaded.pathname});
    }
    await refreshEditor(id);
    $('save-state').textContent = '저장했습니다. 사이트에 반영되었습니다.';
  } catch (error) {

    $('save-state').textContent = error.message;
  } finally { busy(false); $('progress').hidden = true; }
};
$('remove').onclick = async () => {
  if (!confirm('이 항목의 영상 등록을 해제하시겠습니까? 업로드한 파일은 삭제됩니다.')) return;
  const id = $('slot').value;
  busy(true);
  try {
    await api('/api/slot/' + id,'DELETE',{revision:slots.find(s=>s.id===id).revision});
    await refreshEditor(id);
    $('save-state').textContent = '영상 등록을 해제했습니다.';
  } catch (error) { $('save-state').textContent = error.message; }
  finally { busy(false); }
};
async function start() {
  if (admin) {
    $('home').hidden = true; $('admin').hidden = false;
    try {
      const session = await api('/api/session');
      if (!session.owner) {
        $('admin-state').textContent = session.configured ? '영상 관리에 로그인해 주세요.' : '관리자 로그인 설정을 준비하고 있습니다.';
        $('login-form').hidden = !session.configured;
        return;
      }
      $('login-form').hidden = true;
      await refreshEditor();
      $('editor').hidden = false;
      $('admin-state').textContent = '참가팀 영상 30개 · 전체 영상 1개 · Shorts 5개';
      $('slot').onchange = () => {fillEditor(); $('save-state').textContent='';};
    } catch (error) { $('admin-state').textContent = '관리 화면을 불러오지 못했습니다. 다시 접속해 주세요.'; }
    return;
  }
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
  try { slots = await api('/api/videos'); render(); }
  catch { $('load-state').textContent = '영상 목록을 불러오지 못했습니다. 페이지를 새로고침해 주세요.'; }
}
$('login-form').onsubmit = async event => {
  event.preventDefault();
  const button = $('login-form').querySelector('button'); button.disabled = true;
  $('login-state').textContent = '로그인 중입니다.';
  try { await api('/api/login','POST',{password:$('password').value}); $('password').value = ''; await start(); }
  catch(error) { $('login-state').textContent = error.message; }
  finally { button.disabled = false; }
};
$('logout').onclick = async () => {
  try { await api('/api/logout','POST',{}); location.reload(); }
  catch(error) { $('save-state').textContent = error.message; }
};
start();
