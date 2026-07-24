/**
 * Loads repo-root `.env.signing` (gitignored) into the environment, then runs
 * the remaining CLI args. Existing non-empty env vars are not overwritten.
 *
 * Usage:
 *   node ./build-tools/with-signing-env.mjs ow-electron-builder --config ...
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env.signing');
const env = { ...process.env };

if (existsSync(envPath)) {
	for (const rawLine of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) {
			continue;
		}
		const eq = line.indexOf('=');
		if (eq <= 0) {
			continue;
		}
		const key = line.slice(0, eq).trim();
		let value = line.slice(eq + 1).trim();
		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}
		if (env[key] === undefined || env[key] === '') {
			env[key] = value;
		}
	}
	console.log(`[with-signing-env] loaded ${envPath}`);
} else {
	console.warn(
		`[with-signing-env] ${envPath} not found — copy .env.signing.example to .env.signing and fill in secrets`,
	);
}

const args = process.argv.slice(2);
if (args.length === 0) {
	console.error('Usage: node ./build-tools/with-signing-env.mjs <command> [args...]');
	process.exit(1);
}

const child = spawn(args[0], args.slice(1), {
	env,
	stdio: 'inherit',
	shell: true,
	windowsHide: true,
});

child.on('exit', (code, signal) => {
	if (signal) {
		process.kill(process.pid, signal);
		return;
	}
	process.exit(code ?? 1);
});
