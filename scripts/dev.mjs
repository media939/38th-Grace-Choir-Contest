import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import retired from '../api/router.js';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.ics':'text/calendar'};
const root=resolve('public');
const server=createServer(async(req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/admin'||pathname.startsWith('/admin/')){
    res.writeHead(307,{Location:'/'});return res.end();
  }
  if(pathname==='/api'||pathname.startsWith('/api/'))return retired(req,res);
  try{
    const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+'/'))throw Error('outside root');
    const body=await readFile(file);
    res.setHeader('Content-Type',types[extname(file)]||'text/plain');
    res.setHeader('Cache-Control','no-cache');res.end(body);
  }catch{res.statusCode=404;res.end('Not found');}
});
const index=process.argv.indexOf('--port');
const port=index>=0?Number(process.argv[index+1]):Number(process.env.PORT)||3000;
server.listen(port,'0.0.0.0',()=>console.log('Preview server ready'));
