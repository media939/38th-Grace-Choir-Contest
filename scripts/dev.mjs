import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import handler from '../api/router.js';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.ics':'text/calendar'};
const root=resolve('public');
createServer(async(req,res)=>{
  if(req.url.startsWith('/api/'))return handler(req,res);
  try{
    const pathname=new URL(req.url,'http://localhost').pathname;
    const file=resolve(root,'.'+(pathname==='/'||pathname==='/admin'?'/index.html':pathname));
    if(!file.startsWith(root+'/'))throw Error('outside root');
    const body=await readFile(file);res.setHeader('Content-Type',types[extname(file)]||'text/plain');res.end(body);
  }catch{res.statusCode=404;res.end('Not found');}
}).listen(Number(process.argv[process.argv.indexOf('--port')+1]) || Number(process.env.PORT) || 3000,'0.0.0.0',()=>console.log('Preview server ready'));
