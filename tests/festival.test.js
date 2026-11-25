import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {slots,youtube,parseVideos} from '../lib/festival.js';
import retired from '../api/router.js';
const source=JSON.parse(readFileSync(new URL('../videos.json',import.meta.url),'utf8'));

test('all 36 editable slots load without administrator or storage configuration',()=>{
  const entries=parseVideos(source);
  assert.equal(entries.length,36);
  assert.equal(entries.filter(s=>['group','em','gmi'].includes(s.kind)).length,30);
  assert.equal(entries.filter(s=>s.kind==='full').length,1);
  assert.equal(entries.filter(s=>s.kind==='short').length,5);
  const edited=structuredClone(source);
  for(const entry of edited)entry.url='https://youtu.be/abcdefghijk';
  assert.ok(parseVideos(edited).every(s=>s.youtube==='abcdefghijk'));
});
test('YouTube watch, share, Shorts and live links work while lookalike domains are rejected',()=>{
  for(const link of ['https://youtu.be/abcdefghijk','https://www.youtube.com/watch?v=abcdefghijk&t=5','https://youtube.com/shorts/abcdefghijk?si=share','https://youtube.com/live/abcdefghijk','https://m.youtube.com/watch?v=abcdefghijk','https://www.youtube-nocookie.com/embed/abcdefghijk'])assert.equal(youtube(link),'abcdefghijk');
  for(const link of ['javascript:alert(1)','https://youtube.com.evil.example/watch?v=abcdefghijk','https://notyoutube.com/shorts/abcdefghijk','not a url','https://youtu.be/short'])assert.equal(youtube(link),null);
});
test('incorrect link files are rejected before deployment',()=>{
  assert.throws(()=>parseVideos(source.slice(1)),/36개/);
  const duplicate=structuredClone(source);duplicate[1].id=duplicate[0].id;
  assert.throws(()=>parseVideos(duplicate),/중복/);
  const badLink=structuredClone(source);badLink[0].url='https://example.org/video';
  assert.throws(()=>parseVideos(badLink),/유튜브/);
  const badName=structuredClone(source);badName[0].name=42;
  assert.throws(()=>parseVideos(badName),/문자열/);
});
test('previous administrator endpoints no longer authenticate or save changes',()=>{
  for(const method of ['GET','POST','PUT','DELETE']){
    const response={headers:{},setHeader(key,value){this.headers[key]=value},end(body){this.body=JSON.parse(body)}};
    retired({method,url:'/api/slot/g1'},response);
    assert.equal(response.statusCode,410);assert.equal(response.headers['Cache-Control'],'no-store');
  }
});
