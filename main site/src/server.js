const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 8080);
const PUBLIC_DIR = path.resolve(__dirname, '..', 'dist', 'apps', 'web');

if (!fs.existsSync(path.join(PUBLIC_DIR, 'index.html'))) {
    console.error(`Frontend build not found at ${PUBLIC_DIR}`);
    process.exit(1);
}

const MIME_TYPES = {
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

function resolvePublicFile(requestPath) {
    const decodedPath = decodeURIComponent(requestPath);
    const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^\/+/, '');
    const filePath = path.resolve(PUBLIC_DIR, relativePath);

    if (filePath !== PUBLIC_DIR && !filePath.startsWith(`${PUBLIC_DIR}${path.sep}`)) {
        return null;
    }

    return filePath;
}

const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    let filePath;

    try {
        filePath = resolvePublicFile(requestUrl.pathname);
    } catch {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Bad request');
        return;
    }

    if (!filePath) {
        response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Forbidden');
        return;
    }

    fs.stat(filePath, (error, stats) => {
        const shouldUseSpaFallback = error || !stats.isFile();
        const fileToServe = shouldUseSpaFallback ? path.join(PUBLIC_DIR, 'index.html') : filePath;

        fs.readFile(fileToServe, (readError, content) => {
            if (readError) {
                response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
                response.end('The site build is not available yet.');
                return;
            }

            const extension = path.extname(fileToServe).toLowerCase();
            response.writeHead(200, {
                'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
                'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
            });
            response.end(content);
        });
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Altis Voyage web server listening on port ${PORT}; serving ${PUBLIC_DIR}`);
});