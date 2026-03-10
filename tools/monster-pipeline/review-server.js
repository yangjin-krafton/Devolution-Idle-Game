// ============================================================
// Monster Candidate Review Server
// Usage: node review-server.js
// Opens: http://localhost:3456
// ============================================================

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CANDIDATES_DIR = path.join(__dirname, 'candidates');
const PORT = 3456;
const MAX_BODY = 50 * 1024 * 1024; // 50MB limit

function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function serveFile(res, filePath, contentType) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  });
  fs.createReadStream(filePath).pipe(res);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY) { req.destroy(); reject(new Error('Body too large')); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const p = url.pathname;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // Favicon — ignore
    if (p === '/favicon.ico') { res.writeHead(204); res.end(); return; }

    // Serve review.html
    if (p === '/' || p === '/review.html') {
      return serveFile(res, path.join(__dirname, 'review.html'), 'text/html');
    }

    // API: list candidates
    if (p === '/api/candidates') {
      const dirs = fs.readdirSync(CANDIDATES_DIR)
        .filter(d => fs.statSync(path.join(CANDIDATES_DIR, d)).isDirectory())
        .sort();
      const result = dirs.map(dir => {
        const conceptPath = path.join(CANDIDATES_DIR, dir, 'concept.json');
        let concept = null;
        if (fs.existsSync(conceptPath)) {
          concept = JSON.parse(fs.readFileSync(conceptPath, 'utf-8'));
        }
        return { dir, concept };
      });
      return json(res, result);
    }

    // API: list all_images for a candidate
    const allImagesMatch = p.match(/^\/api\/candidates\/([^/]+)\/all-images$/);
    if (allImagesMatch) {
      const dir = decodeURIComponent(allImagesMatch[1]);
      const imgDir = path.join(CANDIDATES_DIR, dir, 'all_images');
      if (!fs.existsSync(imgDir)) return json(res, []);
      const files = fs.readdirSync(imgDir).filter(f => f.endsWith('.png')).sort();
      return json(res, files);
    }

    // API: list selected images
    const selectedMatch = p.match(/^\/api\/candidates\/([^/]+)\/selected$/);
    if (selectedMatch) {
      const dir = decodeURIComponent(selectedMatch[1]);
      const selDir = path.join(CANDIDATES_DIR, dir, 'selected');
      if (!fs.existsSync(selDir)) return json(res, []);
      const files = fs.readdirSync(selDir).filter(f => f.endsWith('.png')).sort();
      return json(res, files);
    }

    // API: flip and save original image in all_images + selected
    const flipMatch = p.match(/^\/api\/candidates\/([^/]+)\/flip$/);
    if (flipMatch && req.method === 'POST') {
      const dir = decodeURIComponent(flipMatch[1]);
      const body = await parseBody(req);
      const { filename, imageData } = body;
      if (!imageData || !filename) return json(res, { error: 'Missing data' }, 400);
      const base64 = imageData.replace(/^data:image\/png;base64,/, '');
      const buf = Buffer.from(base64, 'base64');

      // Save to all_images
      const filePath = path.join(CANDIDATES_DIR, dir, 'all_images', filename);
      if (!fs.existsSync(filePath)) return json(res, { error: 'File not found' }, 404);
      fs.writeFileSync(filePath, buf);
      console.log(`  FLIP saved: ${dir}/all_images/${filename} (${buf.length} bytes)`);

      // Also update selected if this image is the current pick
      const selectedName = filename.replace(/_(\d+)\.png$/, '.png');
      const selectedPath = path.join(CANDIDATES_DIR, dir, 'selected', selectedName);
      if (fs.existsSync(selectedPath)) {
        fs.writeFileSync(selectedPath, buf);
        console.log(`  FLIP saved: ${dir}/selected/${selectedName}`);
      }

      return json(res, { ok: true, filename });
    }

    // API: override selected image (copy from all_images)
    const overrideMatch = p.match(/^\/api\/candidates\/([^/]+)\/override$/);
    if (overrideMatch && req.method === 'POST') {
      const dir = decodeURIComponent(overrideMatch[1]);
      const { source, target } = await parseBody(req);
      const srcPath = path.join(CANDIDATES_DIR, dir, 'all_images', source);
      const dstPath = path.join(CANDIDATES_DIR, dir, 'selected', target);
      if (!fs.existsSync(srcPath)) return json(res, { error: 'Source not found' }, 404);
      fs.copyFileSync(srcPath, dstPath);
      return json(res, { ok: true, source, target });
    }

    // Serve images
    const imgMatch = p.match(/^\/img\/([^/]+)\/(all_images|selected)\/(.+\.png)$/);
    if (imgMatch) {
      const [, dir, folder, file] = imgMatch;
      const imgPath = path.join(CANDIDATES_DIR, decodeURIComponent(dir), folder, decodeURIComponent(file));
      return serveFile(res, imgPath, 'image/png');
    }

    res.writeHead(404);
    res.end('Not found');
  } catch (err) {
    console.error('  ERROR:', err.message);
    if (!res.headersSent) {
      json(res, { error: err.message }, 500);
    }
  }
});

server.listen(PORT, () => {
  console.log(`\n  Monster Review Tool: http://localhost:${PORT}\n`);
});
