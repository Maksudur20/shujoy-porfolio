const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg'
};

const CONFIG_PATH = path.join(__dirname, 'site-config.json');

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = req.url.split('?')[0];

  // API endpoint: GET /api/config
  if (req.method === 'GET' && parsedUrl === '/api/config') {
    fs.readFile(CONFIG_PATH, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Config not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
    return;
  }

  // API endpoint: POST /api/save-config
  if (req.method === 'POST' && parsedUrl === '/api/save-config') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        const formatted = JSON.stringify(parsed, null, 2);
        fs.writeFile(CONFIG_PATH, formatted, 'utf8', (err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to write config file' }));
            return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Configuration saved to site-config.json' }));
        });
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    });
    return;
  }

  // API endpoint: POST /api/login
  if (req.method === 'POST' && parsedUrl === '/api/login') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { password } = JSON.parse(body);
        let expectedPassword = 'thikase';
        if (fs.existsSync(CONFIG_PATH)) {
          const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
          if (cfg.auth && cfg.auth.adminPassword) {
            expectedPassword = cfg.auth.adminPassword;
          }
        }
        if (password === expectedPassword) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Authenticated successfully' }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Incorrect password' }));
        }
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  // API endpoint: POST /api/change-password
  if (req.method === 'POST' && parsedUrl === '/api/change-password') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const { oldPassword, newPassword } = JSON.parse(body);
        if (!newPassword || newPassword.length < 3) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'New password must be at least 3 characters' }));
          return;
        }

        let cfg = {};
        if (fs.existsSync(CONFIG_PATH)) {
          cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        }
        const currentPassword = (cfg.auth && cfg.auth.adminPassword) || 'thikase';
        if (oldPassword !== currentPassword) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Old password does not match' }));
          return;
        }

        if (!cfg.auth) cfg.auth = {};
        cfg.auth.adminPassword = newPassword;

        fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Password updated successfully' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to update password' }));
      }
    });
    return;
  }

  // Custom Secret Route: /thikase1/thikase2/admin/login.com or /thikase1/thikase2/admin/
  if (parsedUrl === '/thikase1/thikase2/admin/login.com' || parsedUrl === '/thikase1/thikase2/admin/login' || parsedUrl === '/thikase1/thikase2/admin' || parsedUrl === '/thikase1/thikase2/admin/') {
    const loginFilePath = path.join(__dirname, 'thikase1', 'thikase2', 'admin', 'login.html');
    fs.readFile(loginFilePath, (err, content) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Login page not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
    return;
  }

  let reqPath = decodeURI(parsedUrl);
  let filePath = path.join(__dirname, reqPath === '/' ? 'index.html' : reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Handle range requests for video playback
    if (ext === '.mp4' || ext === '.webm') {
      const range = req.headers.range;
      const fileSize = stats.size;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': contentType,
        };
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        const head = {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes'
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Secret Admin Login: http://localhost:${PORT}/thikase1/thikase2/admin/login.com`);
});
