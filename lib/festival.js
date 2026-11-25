export const slots = [
  ...Array.from({length: 28}, (_, i) => ({id: `g${i+1}`, kind:'group', name:`${i+1}그룹`})),
  {id:'em',kind:'em',name:'EM'}, {id:'gmi',kind:'gmi',name:'GMI 은혜교회'},
  {id:'full',kind:'full',name:'제38회 은혜성가제 전체 영상'},
  ...Array.from({length:5},(_,i)=>({id:`s${i+1}`,kind:'short',name:`성가제 Shorts ${i+1}`}))
].map(slot=>({...slot,song:''}));
export function youtube(raw){
  let url;try{url=new URL(raw)}catch{return null}
  if(!['https:','http:'].includes(url.protocol))return null;
  const parts=url.pathname.split('/').filter(Boolean);let id;
  if(['youtu.be','www.youtu.be'].includes(url.hostname))id=parts[0];
  if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(url.hostname))
    id=['shorts','live','embed'].includes(parts[0])?parts[1]:url.searchParams.get('v');
  return /^[a-zA-Z0-9_-]{11}$/.test(id||'')?id:null;
}
export function parseVideos(entries) {
  if (!Array.isArray(entries) || entries.length !== slots.length)
    throw Error('videos.json에는 36개 영상 항목이 있어야 합니다.');
  const byId = new Map();
  for (const entry of entries) {
    if (!entry || !slots.some(slot=>slot.id===entry.id) || byId.has(entry.id))
      throw Error('videos.json의 id가 없거나 중복되어 있습니다.');
    if (typeof entry.name!=='string' || typeof entry.song!=='string' || typeof entry.url!=='string')
      throw Error(entry.id + ': 이름, 찬양곡, url을 문자열로 입력해 주세요.');
    if (entry.name.length>80 || entry.song.length>160)
      throw Error(entry.id + ': 이름 또는 찬양곡 설명이 너무 깁니다.');
    const url=entry.url.trim();
    const video=url ? youtube(url) : null;
    if (url && !video) throw Error(entry.id + ': 유튜브 영상 주소를 확인해 주세요.');
    byId.set(entry.id,{name:entry.name.trim(),song:entry.song.trim(),youtube:video});
  }
  return slots.map(slot=>{
    const entry=byId.get(slot.id);
    return {...slot,...entry,name:entry.name||slot.name};
  });
}
