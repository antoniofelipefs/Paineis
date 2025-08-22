import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = 8080;
const distPath = path.join(__dirname, 'dist');

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg'
};

const server = http.createServer((req, res) => {
  // Parse URL and remove query string
  let filePath = req.url.split('?')[0];
  
  // Default to index.html for root requests
  if (filePath === '/') {
    filePath = '/index.html';
  }
  
  // Build full file path
  const fullPath = path.join(distPath, filePath);
  
  // Get file extension
  const extname = String(path.extname(fullPath)).toLowerCase();
  const mimeType = mimeTypes[extname] || 'application/octet-stream';
  
  // Check if file exists
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found, serve index.html for SPA routing
      const indexPath = path.join(distPath, 'index.html');
      fs.readFile(indexPath, (error, content) => {
        if (error) {
          res.writeHead(500);
          res.end('Erro interno do servidor');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        }
      });
    } else {
      // File exists, serve it
      fs.readFile(fullPath, (error, content) => {
        if (error) {
          res.writeHead(500);
          res.end('Erro interno do servidor');
        } else {
          res.writeHead(200, { 'Content-Type': mimeType });
          res.end(content, 'utf-8');
        }
      });
    }
  });
});

server.listen(port, () => {
  console.log('========================================');
  console.log('      SLA PAINEL - SERVIDOR LOCAL');
  console.log('========================================');
  console.log('');
  console.log(`✅ Servidor iniciado com sucesso!`);
  console.log(`🌐 Acesse: http://localhost:${port}`);
  console.log('');
  console.log('⚠️  Mantenha esta janela aberta');
  console.log('❌ Para parar: Pressione Ctrl+C');
  console.log('========================================');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n========================================');
  console.log('⏹️  Servidor parado pelo usuário');
  console.log('========================================');
  process.exit(0);
});