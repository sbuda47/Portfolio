// Dependency-free preview of the exact Pages artifact, including /Portfolio/.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../_site');
const port = Number(process.argv[2] || 4176);
if (!fs.existsSync(path.join(root, 'index.html'))) {
  throw new Error('Run python scripts/build-site.py before previewing.');
}
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.pdf': 'application/pdf', '.mp4': 'video/mp4',
};
http.createServer((request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, {Allow: 'GET, HEAD'}).end();
    return;
  }
  let requested;
  try { requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400).end(); return; }
  if (requested === '/') {
    response.writeHead(302, {Location: '/Portfolio/'}).end();
    return;
  }
  if (!requested.startsWith('/Portfolio/') || requested.includes('\\')) {
    response.writeHead(404).end('Not found');
    return;
  }
  const relative = requested.slice('/Portfolio/'.length) || 'index.html';
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  let stat;
  try { stat = fs.statSync(file); if (!stat.isFile()) throw new Error('Not a file'); }
  catch {
    const missing = fs.readFileSync(path.join(root, '404.html'));
    response.writeHead(404, {'Content-Type': types['.html'], 'Cache-Control': 'no-store'});
    response.end(request.method === 'HEAD' ? undefined : missing);
    return;
  }
  const headers = {
    'Content-Type': types[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
  };
  let start = 0, end = stat.size - 1, status = 200;
  if (request.headers.range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
    if (!match || (!match[1] && !match[2])) {
      response.writeHead(416, {'Content-Range': 'bytes */' + stat.size}).end();
      return;
    }
    start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2]));
    end = match[1] && match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
    if (start > end || start >= stat.size) {
      response.writeHead(416, {'Content-Range': 'bytes */' + stat.size}).end();
      return;
    }
    status = 206;
    headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + stat.size;
  }
  headers['Content-Length'] = end - start + 1;
  response.writeHead(status, headers);
  if (request.method === 'HEAD') { response.end(); return; }
  fs.createReadStream(file, {start, end}).on('error', () => response.destroy()).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log('Pages preview: http://127.0.0.1:' + port + '/Portfolio/');
});
