const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 8080);
const POCKETBASE_PORT = Number(process.env.POCKETBASE_PORT || 8090);
const PUBLIC_DIR = path.resolve(__dirname, '..', 'dist', 'apps', 'web');
const POCKETBASE_ROOT = path.resolve(__dirname, '..', 'apps', 'pocketbase');
const APPLICATION_ROOT = path.resolve(__dirname, '..');
const configuredPocketbaseBinary = process.env.POCKETBASE_BINARY;
const configuredPocketbaseDataDir = process.env.POCKETBASE_DATA_DIR;
const POCKETBASE_BINARY = configuredPocketbaseBinary
    ? path.resolve(APPLICATION_ROOT, configuredPocketbaseBinary)
    : undefined;
const POCKETBASE_DATA_DIR = configuredPocketbaseDataDir
    ? path.resolve(APPLICATION_ROOT, configuredPocketbaseDataDir)
    : path.resolve(POCKETBASE_ROOT, 'pb_data');

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

let pocketbaseProcess;

if (POCKETBASE_BINARY) {
    if (!fs.existsSync(POCKETBASE_BINARY)) {
        console.error(`PocketBase binary not found at ${POCKETBASE_BINARY}`);
        process.exit(1);
    }

    pocketbaseProcess = spawn(POCKETBASE_BINARY, [
        'serve',
        `--http=127.0.0.1:${POCKETBASE_PORT}`,
        '--encryptionEnv=PB_ENCRYPTION_KEY',
        `--dir=${POCKETBASE_DATA_DIR}`,
        `--migrationsDir=${path.join(POCKETBASE_ROOT, 'pb_migrations')}`,
        `--hooksDir=${path.join(POCKETBASE_ROOT, 'pb_hooks')}`,
        '--hooksWatch=false',
    ], { stdio: 'inherit' });

    pocketbaseProcess.on('exit', (code, signal) => {
        console.error(`PocketBase stopped (code=${code}, signal=${signal || 'none'})`);
        process.exitCode = code || 1;
    });
} else {
    console.warn('POCKETBASE_BINARY is not configured; CMS proxy is disabled.');
}

function proxyToPocketBase(request, response) {
    const proxyRequest = http.request({
        hostname: '127.0.0.1',
        port: POCKETBASE_PORT,
        method: request.method,
        path: request.url.replace(/^\/hcgi\/platform/, '') || '/',
        headers: { ...request.headers, host: `127.0.0.1:${POCKETBASE_PORT}` },
    }, (proxyResponse) => {
        response.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
        proxyResponse.pipe(response);
    });

    proxyRequest.on('error', () => {
        if (!response.headersSent) {
            response.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
        }
        response.end(JSON.stringify({ message: 'PocketBase is not ready.' }));
    });

    request.pipe(proxyRequest);
}

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
    if (request.url.startsWith('/hcgi/platform')) {
        proxyToPocketBase(request, response);
        return;
    }

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