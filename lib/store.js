import {get,put,head,del} from '@vercel/blob';
import {randomUUID} from 'node:crypto';
import {getSlot,requireValue,validateVideoPath,MAX_UPLOAD} from './festival.js';
const catalogPath='metadata/festival.json';
export const storageReady=()=>!!process.env.BLOB_READ_WRITE_TOKEN || !!(process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN);
export async function readCatalog(){
  requireValue(storageReady(),'영상 저장소 연결이 필요합니다.',503);
  const data=await get(catalogPath,{access:'public',useCache:false});
  if(!data)return {records:{},etag:null};
  const content=await new Response(data.stream).json();
  requireValue(content.version===1 && content.records && typeof content.records==='object','영상 목록을 읽을 수 없습니다.',500);
  return {records:content.records,etag:data.blob.etag};
}
export async function writeSlot(id,values,expectedRevision){
  getSlot(id);
  const catalog=await readCatalog(),previous=catalog.records[id];
  requireValue((previous?.revision||null)===(expectedRevision||null),'다른 변경사항이 있습니다. 목록을 새로고침한 뒤 다시 저장해 주세요.',409);
  const entry={...values,updated:new Date().toISOString(),revision:randomUUID()};
  catalog.records[id]=entry;
  try{
    await put(catalogPath,JSON.stringify({version:1,records:catalog.records}),{
      access:'public',contentType:'application/json',addRandomSuffix:false,
      allowOverwrite:!!catalog.etag,...(catalog.etag?{ifMatch:catalog.etag}:{}),cacheControlMaxAge:60
    });
  }catch(error){
    if(/Precondition|AlreadyExists/.test(error.name))throw Object.assign(new Error('목록이 변경되었습니다. 새로고침 후 다시 저장해 주세요.'),{status:409});
    throw error;
  }
  if(previous?.file?.pathname && previous.file.pathname!==values.file?.pathname){
    await del(previous.file.pathname).catch(()=>console.error('Old video cleanup failed'));
  }
  return entry;
}
export async function resolveVideo(path,id){
  validateVideoPath(path,id);
  const file=await head(path);
  requireValue(['video/mp4','video/webm'].includes(file.contentType)&&file.size>0&&file.size<=MAX_UPLOAD,'영상 파일의 형식 또는 크기를 확인해 주세요.');
  return {pathname:file.pathname,url:file.url,size:file.size,contentType:file.contentType};
}
