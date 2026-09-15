import http from 'node:http';
import next from 'next';

const port = Number(process.env.PORT || 3000);
const hostname = '0.0.0.0';
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

http.createServer((request, response) => {
	handle(request, response);
}).listen(port, hostname, () => {
	console.log(`Altis Voyage Next.js server running on port ${port}`);
});
