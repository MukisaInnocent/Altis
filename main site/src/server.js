const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 8080);
const PUBLIC_DIR = path.resolve(__dirname, '..', 'dist', 'apps', 'web');
const APPLICATION_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(APPLICATION_ROOT, process.env.APP_DATA_DIR || 'data');
const DATA_FILE = path.join(DATA_DIR, 'altis-voyage.json');

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

const sessions = new Map();

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, 64, (error, derivedKey) => {
            if (error) reject(error);
            else resolve({ salt, hash: derivedKey.toString('hex') });
        });
    });
}

function safeEqual(left, right) {
    const a = Buffer.from(left, 'hex');
    const b = Buffer.from(right, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function readStore() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) {
        const password = process.env.PB_SUPERUSER_PASSWORD || 'change-this-production-password';
        const adminEmail = process.env.PB_SUPERUSER_EMAIL || 'admin@altistravels.com';
        return { users: [], collections: {}, adminEmail, adminPassword: password };
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

let store = readStore();
let adminPasswordRecord = store.adminPasswordHash;
const initialAdminPassword = store.adminPassword || process.env.PB_SUPERUSER_PASSWORD;
if (!adminPasswordRecord && initialAdminPassword) {
    adminPasswordRecord = crypto.scryptSync(initialAdminPassword, 'altis-voyage-admin', 64).toString('hex');
    store.adminPasswordHash = adminPasswordRecord;
    delete store.adminPassword;
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function saveStore() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

function json(response, status, body) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(body));
}

function parseBody(request) {
    return new Promise((resolve, reject) => {
        let body = '';
        request.on('data', (chunk) => { body += chunk; });
        request.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); } catch (error) { reject(error); }
        });
        request.on('error', reject);
    });
}

function authRecord(email) {
    return { id: 'admin', collectionId: 'users', collectionName: 'users', email, role: 'admin', verified: true };
}

async function handleApi(request, response, apiPath) {
    if (apiPath === '/api/health') return json(response, 200, { code: 200, message: 'API is healthy.' });

    if (apiPath === '/api/collections/users/auth-with-password' && request.method === 'POST') {
        const body = await parseBody(request);
        const email = body.identity || body.email;
        const passwordHash = crypto.scryptSync(body.password || '', 'altis-voyage-admin', 64).toString('hex');
        if (email !== (store.adminEmail || process.env.PB_SUPERUSER_EMAIL || 'admin@altistravels.com') || !adminPasswordRecord || !safeEqual(passwordHash, adminPasswordRecord)) {
            return json(response, 400, { code: 400, message: 'Invalid email or password.' });
        }
        const token = crypto.randomBytes(32).toString('hex');
        const record = authRecord(email);
        sessions.set(token, record);
        return json(response, 200, { token, record });
    }

    const token = (request.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const user = sessions.get(token);
    const recordsMatch = apiPath.match(/^\/api\/collections\/([^/]+)\/records(?:\/([^/]+))?$/);
    if (!recordsMatch) return json(response, 404, { code: 404, message: 'Not found.' });
    const [, collection, recordId] = recordsMatch;
    const isPublicInquiry = collection === 'inquiries' && request.method === 'POST';
    if (!user && !isPublicInquiry) return json(response, 401, { code: 401, message: 'Authentication required.' });

    const records = store.collections[collection] || [];
    if (request.method === 'GET' && !recordId) {
        return json(response, 200, { page: 1, perPage: records.length || 1, totalItems: records.length, totalPages: 1, items: records });
    }
    if (request.method === 'GET' && recordId) return json(response, 200, records.find((record) => record.id === recordId) || {});
    const body = await parseBody(request);
    if (request.method === 'POST') {
        const record = { ...body, id: crypto.randomUUID(), created: new Date().toISOString(), updated: new Date().toISOString() };
        store.collections[collection] = [...records, record];
        saveStore();
        return json(response, 200, record);
    }
    const index = records.findIndex((record) => record.id === recordId);
    if (index < 0) return json(response, 404, { code: 404, message: 'Record not found.' });
    if (request.method === 'PATCH' || request.method === 'PUT') {
        const updated = { ...records[index], ...body, updated: new Date().toISOString() };
        store.collections[collection][index] = updated;
        saveStore();
        return json(response, 200, updated);
    }
    if (request.method === 'DELETE') {
        store.collections[collection].splice(index, 1);
        saveStore();
        return json(response, 204, {});
    }
    return json(response, 405, { code: 405, message: 'Method not allowed.' });
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
        handleApi(request, response, new URL(request.url, `http://${request.headers.host || 'localhost'}`).pathname.replace('/hcgi/platform', '')).catch((error) => {
            console.error(error);
            json(response, 500, { code: 500, message: 'Backend request failed.' });
        });
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