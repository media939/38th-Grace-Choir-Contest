export const slots = [
  ...Array.from({length: 28}, (_, i) => ({id: `g${i+1}`, kind:'group', name:`${i+1}그룹`})),
  {id:'em',kind:'em',name:'EM'}, {id:'gmi',kind:'gmi',name:'GMI 은혜교회'},
  {id:'full',kind:'full',name:'제38회 은혜성가제 전체 영상'},
  ...Array.from({length:5},(_,i)=>({id:`s${i+1}`,kind:'short',name:`성가제 Shorts ${i+1}`}))
].map(slot=>({...slot,song:''}));
export const MAX_UPLOAD = 10 * 1024 ** 3;
export function requireValue(value,message,status=400){
  if(!value) throw Object.assign(new Error(message),{status});
}
export function getSlot(id){
  const slot=slots.find(s=>s.id===id);
  requireValue(slot,'영상 항목을 찾을 수 없습니다.',404); return slot;
}
export function fields(input){
  const name=typeof input.name==='string'?input.name.trim():'';
  const song=typeof input.song==='string'?input.song.trim():'';
  requireValue(name && name.length<=80 && song.length<=160,'이름과 설명의 길이를 확인해 주세요.');
  return {name,song};
}
export function youtube(raw){
  let url;try{url=new URL(raw)}catch{return null}
  if(!['https:','http:'].includes(url.protocol))return null;
  const parts=url.pathname.split('/').filter(Boolean);let id;
  if(['youtu.be','www.youtu.be'].includes(url.hostname))id=parts[0];
  if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(url.hostname))
    id=['shorts','live','embed'].includes(parts[0])?parts[1]:url.searchParams.get('v');
  return /^[a-zA-Z0-9_-]{11}$/.test(id||'')?id:null;
}
export function validateVideoPath(path,id){
  getSlot(id);
  requireValue(typeof path==='string' && path.startsWith(`videos/${id}/`) &&
    /^videos\/(g[1-9]|g1\d|g2[0-8]|em|gmi|full|s[1-5])\/[a-f0-9-]{36}\.(mp4|webm)$/.test(path),
    '올바르지 않은 영상 파일 경로입니다.');
  return path;
}
export function publicSlots(catalog){
  return slots.map(slot=>{
    const entry=catalog.records[slot.id]||{};
    return {...slot,name:entry.name||slot.name,song:entry.song||'',youtube:entry.youtube||null,
      file:!!entry.file,videoUrl:entry.file?.url||null,updated:entry.updated||null,revision:entry.revision||null};
  });
}
