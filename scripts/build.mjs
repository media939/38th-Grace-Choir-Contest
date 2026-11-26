import {mkdir,readFile,writeFile,copyFile,rm} from 'node:fs/promises';
import {parseVideos} from '../lib/festival.js';
import {parseLive} from '../lib/live.js';
const videos=JSON.parse(await readFile('videos.json','utf8'));
parseVideos(videos);
const live=parseLive(JSON.parse(await readFile('live.json','utf8')));
const escapeHtml=value=>value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
await rm('public',{recursive:true,force:true});
await mkdir('public/photo',{recursive:true});
const page=(await readFile('src/page.html','utf8'))
  .replaceAll('__LIVE_URL__',escapeHtml(live.url))
  .replaceAll('__LIVE_CLASS__',live.isLive?' is-live':'')
  .replaceAll('__LIVE_HIDDEN__',live.isLive?'':' hidden')
  .replaceAll('__LIVE_LABEL__',live.isLive?'생방송 중 · 생방송 보기 (YouTube 새 창)':'생방송 보기 (YouTube 새 창)');
await writeFile('public/index.html',page);
for(const [source,dest] of [['src/app.js','app.js'],['lib/festival.js','festival.js'],['lib/live.js','live.js'],['assets/gmi-logo.png','gmi-logo.png']])
  await copyFile(source,'public/'+dest);
await writeFile('public/videos.json',JSON.stringify(videos,null,2)+'\n');
await writeFile('public/live.json',JSON.stringify(live,null,2)+'\n');
for(const [i,n] of ['8746','8408','8937','9105','9120'].entries())
  await copyFile(`photos/20251214-IMG_${n}.jpg`,`public/photo/${i}.jpg`);
const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//GMI//Choir Festival//KO','BEGIN:VEVENT','UID:gmi-choir-38-2026@gracemi.com','DTSTAMP:20261125T000000Z','DTSTART:20261213T223000Z','SUMMARY:제38회 은혜성가제','LOCATION:은혜한인교회 비전센터 본당','DESCRIPTION:28개 그룹과 EM\\, GMI 은혜교회 참가','END:VEVENT','END:VCALENDAR',''];
await writeFile('public/festival.ics',ics.join('\r\n'));
await writeFile('public/robots.txt','User-agent: *\nAllow: /\n');
await writeFile('public/favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#0c1729"/><text x="32" y="44" text-anchor="middle" font-size="35" fill="#e9c17d">38</text></svg>');
console.log('Built: live stream button, 36 YouTube link slots, 5 photos, 2 logos, no administrator page.');
