import test from 'node:test';
import assert from 'node:assert/strict';
import {slots,youtube,fields,publicSlots} from '../lib/festival.js';
import {configured,correctPassword,sessionCookie,owner,sameOrigin} from '../lib/auth.js';
import handler from '../api/router.js';
const env={ADMIN_PASSWORD:'test-only-long-password-abc123',SESSION_SECRET:'test-only-session-signing-key-abcdefghijklmnopqrstuvwxyz'};

test('30 participants, one full video, five Shorts and unique IDs',()=>{
  assert.equal(slots.length,36);assert.equal(new Set(slots.map(s=>s.id)).size,36);
  assert.equal(slots.filter(s=>['group','em','gmi'].includes(s.kind)).length,30);
  assert.equal(slots.filter(s=>s.kind==='full').length,1);assert.equal(slots.filter(s=>s.kind==='short').length,5);
});
test('YouTube link formats supported without accepting lookalike domains',()=>{
  for(const link of ['https://youtu.be/abcdefghijk','https://www.youtube.com/watch?v=abcdefghijk&t=5','https://youtube.com/shorts/abcdefghijk','https://youtube.com/live/abcdefghijk','https://m.youtube.com/watch?v=abcdefghijk','https://www.youtube-nocookie.com/embed/abcdefghijk','https://youtube.com/shorts/abcdefghijk?si=share'])assert.equal(youtube(link),'abcdefghijk');
  for(const link of ['javascript:alert(1)','https://youtube.com.evil.example/watch?v=abcdefghijk','https://notyoutube.com/shorts/abcdefghijk','not a url','https://youtu.be/short'])assert.equal(youtube(link),null);
});
test('metadata fields are bounded and internal storage details are not exposed',()=>{
  assert.deepEqual(fields({name:' EM ',song:' 찬양 '}),{name:'EM',song:'찬양'});
  assert.throws(()=>fields({name:' '}));assert.throws(()=>fields({name:'x'.repeat(81)}));
  const list=publicSlots({records:{g1:{name:'G1',file:{pathname:'videos/g1/a',url:'https://example.test/v.mp4'}}}});
  assert.equal(list[0].file,undefined);assert.equal(list[0].videoUrl,undefined);assert.equal(list[0].pathname,undefined);
});
test('admin authentication fails closed, signs sessions, rejects tampering and expires',()=>{
  assert.equal(configured({}),false);assert.equal(correctPassword(env.ADMIN_PASSWORD,env),true);assert.equal(correctPassword('wrong',env),false);
  const time=Date.now(),cookie=sessionCookie(env,time).split(';')[0];
  assert.equal(owner({headers:{cookie}},env,time+1000),true);
  assert.equal(owner({headers:{cookie}},env,time+13*60*60*1000),false);
  assert.equal(owner({headers:{cookie:cookie+'x'}},env,time),false);
  assert.equal(owner({headers:{cookie}}, {...env,SESSION_SECRET:'different-session-secret-at-least-32-characters'},time),false);
  assert.match(sessionCookie(env),/HttpOnly; Secure; SameSite=Strict/);
});
test('cross-origin write requests are rejected',()=>{
  assert.doesNotThrow(()=>sameOrigin({headers:{origin:'https://festival.test',host:'festival.test','sec-fetch-site':'same-origin'}}));
  assert.throws(()=>sameOrigin({headers:{origin:'https://evil.test',host:'festival.test'}}),e=>e.status===403);
  assert.throws(()=>sameOrigin({headers:{host:'festival.test'}}),e=>e.status===403);
});
test('API denies unauthenticated writes before touching storage',async()=>{
  const req={url:'/api/slot/g1',method:'PUT',headers:{host:'festival.test',origin:'https://festival.test'},body:{name:'test'}};
  const result={headers:{},setHeader(k,v){this.headers[k]=v},end(body){this.body=JSON.parse(body)}};
  await handler(req,result);assert.equal(result.statusCode,401);assert.equal(result.headers['Cache-Control'],'no-store');
});
