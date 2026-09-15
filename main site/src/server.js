import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const server = spawn(npmCommand, ['start'], {
	cwd: projectRoot,
	env: process.env,
	stdio: 'inherit'
});

server.on('exit', (code, signal) => {
	if (signal) process.kill(process.pid, signal);
	process.exit(code ?? 1);
});
