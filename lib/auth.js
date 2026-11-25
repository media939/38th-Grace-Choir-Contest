import {createHash,createHmac,timingSafeEqual,randomBytes} from 'node:crypto';
import {requireValue} from './festival.js';
const cookieName='__Host-grace-admin';
export function configured(env=process.env){return typeof env.ADMIN_PASSWORD==='string' && env.ADMIN_PASSWORD.length>=20 && typeof env.SESSION_SECRET==='string' && env.SESSION_SECRET.length>=32;}
const digest=value=>createHash('sha256').update(String(value)).digest();
export function correctPassword(value,env=process.env){return configured(env) && typeof value==='string' && value.length<256 && timingSafeEqual(digest(value),digest(env.ADMIN_PASSWORD));}
const signature=(value,env)=>createHmac('sha256',env.SESSION_SECRET).update(value).digest('base64url');
export function sessionCookie(env=process.env,now=Date.now()){
  requireValue(configured(env),'관리자 로그인이 아직 설정되지 않았습니다.',503);
  const value=Buffer.from(JSON.stringify({exp:now+12*60*60*1000,nonce:randomBytes(16).toString('hex')})).toString('base64url');
  return `${cookieName}=${value}.${signature(value,env)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`;
}
export const logoutCookie=()=>`${cookieName}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
export function owner(request,env=process.env,now=Date.now()){
  if(!configured(env))return false;
  const value=String(request.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);
  if(!value||value.length>1024)return false;
  try{
    const [payload,sig]=value.split('.');
    if(!sig || !timingSafeEqual(digest(sig),digest(signature(payload,env))))return false;
    const data=JSON.parse(Buffer.from(payload,'base64url').toString());
    return Number.isSafeInteger(data.exp)&&data.exp>now&&data.exp<=now+12*60*60*1000;
  }catch{return false}
}
export function sameOrigin(request){
  const origin=request.headers.origin;
  const host=request.headers.host;
  requireValue(origin && host && new URL(origin).host===host &&
    (origin.startsWith('https://') || /^localhost(:\d+)?$/.test(host)) &&
    request.headers['sec-fetch-site']!=='cross-site','허용되지 않는 요청입니다.',403);
}
