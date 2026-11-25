import {handleUpload} from '@vercel/blob/client';
import {setTimeout as delay} from 'node:timers/promises';
import {slots,getSlot,fields,youtube,requireValue,publicSlots,validateVideoPath,MAX_UPLOAD} from '../lib/festival.js';
import {configured,correctPassword,owner,sameOrigin,sessionCookie,logoutCookie} from '../lib/auth.js';
import {readCatalog,writeSlot,resolveVideo,storageReady} from '../lib/store.js';
const attempts=new Map();
async function bodyOf(request){
  if(request.body && typeof request.body==='object')return request.body;
  if(typeof request.body==='string')return JSON.parse(request.body);
  let text='';for await(const part of request){text+=part;requireValue(text.length<16384,'요청이 너무 큽니다.',413)}
  return text?JSON.parse(text):{};
}
function send(response,status,value){
  response.setHeader('Cache-Control','no-store');
  response.setHeader('X-Content-Type-Options','nosniff');
  response.setHeader('Content-Type','application/json; charset=utf-8');
  response.statusCode=status;response.end(JSON.stringify(value));
}
export default async function handler(request,response){
  try{
    const url=new URL(request.url,'https://'+request.headers.host);
    const route=url.searchParams.get('path') || url.pathname.replace(/^\/api\/?/,'');
    const [action,id]=route.split('/'),method=request.method;
    if(action==='session'&&method==='GET')return send(response,200,{owner:owner(request),configured:configured(),storage:storageReady()});
    if(action==='videos'&&method==='GET')return send(response,200,publicSlots(await readCatalog()));
    if(action==='login'&&method==='POST'){
      sameOrigin(request);
      requireValue(configured(),'관리자 로그인이 아직 설정되지 않았습니다.',503);
      const ip=String(request.headers['x-forwarded-for']||request.socket?.remoteAddress||'unknown').split(',')[0];
      const now=Date.now(),prior=attempts.get(ip);
      const state=prior?.until>now?prior:{count:0,until:now+15*60*1000};
      requireValue(state.count<8,'로그인 시도가 너무 많습니다. 15분 뒤 다시 시도해 주세요.',429);
      const input=await bodyOf(request);
      if(!correctPassword(input.password)){
        state.count++;if(attempts.size>1000)attempts.clear();attempts.set(ip,state);
        await delay(700);return send(response,401,{error:'비밀번호를 확인해 주세요.'});
      }
      attempts.delete(ip);response.setHeader('Set-Cookie',sessionCookie());return send(response,200,{ok:true});
    }
    if(action==='upload'&&method==='POST'){
      const body=await bodyOf(request);
      // The SDK verifies upload callbacks; only signed-in owners receive upload tokens.
      const result=await handleUpload({body,request,onBeforeGenerateToken:async(path)=>{
        sameOrigin(request);requireValue(owner(request),'관리자 로그인이 필요합니다.',401);
        const slot=path.split('/')[1];validateVideoPath(path,slot);
        return {allowedContentTypes:['video/mp4','video/webm'],maximumSizeInBytes:MAX_UPLOAD,
          addRandomSuffix:false,allowOverwrite:false,validUntil:Date.now()+24*60*60*1000};
      }});
      return send(response,200,result);
    }
    sameOrigin(request);requireValue(owner(request),'관리자 로그인이 필요합니다.',401);
    if(action==='logout'&&method==='POST'){
      response.setHeader('Set-Cookie',logoutCookie());return send(response,200,{ok:true});
    }
    requireValue(action==='slot'&&['PUT','DELETE'].includes(method),'페이지를 찾을 수 없습니다.',404);
    const slot=getSlot(id),input=await bodyOf(request);
    const catalog=await readCatalog(),prior=catalog.records[id];
    let value;
    if(method==='DELETE')value={name:prior?.name||slot.name,song:prior?.song||''};
    else{
      const entry=fields(input);
      if(input.pathname)value={...entry,file:await resolveVideo(input.pathname,id)};
      else if(input.keep)value={...prior,...entry};
      else{const video=youtube(input.url);requireValue(video,'올바른 YouTube 영상 주소를 입력해 주세요.');value={...entry,youtube:video};}
    }
    await writeSlot(id,value,input.revision);return send(response,200,{ok:true});
  }catch(error){
    if(!error.status)console.error('Festival API error',error.name);
    send(response,error.status||500,{error:error.status?error.message:'요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'});
  }
}
