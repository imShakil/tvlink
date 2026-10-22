import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon'
};

function runBuild(callback) {
  const buildProcess = spawn('node', ['src/build.js'], { cwd: ROOT_DIR, stdio: 'inherit' });
  buildProcess.on('close', (code) => {
    if (callback) callback(code === 0);
  });
}

const server = http.createServer((req, res) => {
  let reqUrl = req.url.split('?')[0];

  let filePath = path.join(DIST_DIR, reqUrl);

  // If path is a directory or ends with slash, look for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  } else if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  } else if (!fs.existsSync(filePath) && !path.extname(filePath)) {
    const tryIndex = path.join(filePath, 'index.html');
    if (fs.existsSync(tryIndex)) {
      filePath = tryIndex;
    }
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // 404 fallback
    const notFoundPath = path.join(DIST_DIR, '404.html');
    if (fs.existsSync(notFoundPath)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(notFoundPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  }
});

// Watch for file changes in src/, content/, and public/
let isBuilding = false;
let buildQueued = false;

function triggerRebuild() {
  if (isBuilding) {
    buildQueued = true;
    return;
  }

  isBuilding = true;
  console.log('\n🔄 File change detected, rebuilding static site...');
  runBuild(() => {
    isBuilding = false;
    if (buildQueued) {
      buildQueued = false;
      triggerRebuild();
    }
  });
}

function setupWatcher(dir) {
  if (fs.existsSync(dir)) {
    fs.watch(dir, { recursive: true }, (event, filename) => {
      if (filename && !filename.startsWith('.')) {
        triggerRebuild();
      }
    });
  }
}

// Initial Build and start server
runBuild((success) => {
  if (!success) {
    console.error('Initial build failed. Starting server anyway...');
  }

  server.listen(PORT, () => {
    console.log(`\n🎉 Dekho Prime Local Dev Server running at:`);
    console.log(`   ➜ Local:   http://localhost:${PORT}/`);
    console.log(`   ➜ Articles: http://localhost:${PORT}/article/`);
    console.log(`   ➜ Downloads: http://localhost:${PORT}/downloads/`);
    console.log(`   ➜ Changelog: http://localhost:${PORT}/changelog/\n`);
    console.log(`👀 Watching content/, src/, and public/ for instant live changes...`);
  });

  setupWatcher(path.join(ROOT_DIR, 'content'));
  setupWatcher(path.join(ROOT_DIR, 'src'));
  setupWatcher(path.join(ROOT_DIR, 'public'));
});
