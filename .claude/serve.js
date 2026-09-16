const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const types = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.ico':'image/x-icon'};
http.createServer((req,res)=>{
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' ) p = '/index.html';
  const f = path.join(root, p);
  if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(f,(e,d)=>{
    if(e){res.writeHead(404,{'content-type':'text/plain'});return res.end('404');}
    res.writeHead(200,{'content-type':types[path.extname(f)]||'application/octet-stream','cache-control':'no-store'});
    res.end(d);
  });
}).listen(4173, ()=>console.log('serving on http://localhost:4173'));
