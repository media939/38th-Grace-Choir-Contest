// Retire previous administrator endpoints when replacing an existing GitHub upload.
export default function handler(request,response){
  response.statusCode=410;
  response.setHeader('Cache-Control','no-store');
  response.setHeader('Content-Type','application/json; charset=utf-8');
  response.end(JSON.stringify({error:'이 기능은 더 이상 제공되지 않습니다.'}));
}
