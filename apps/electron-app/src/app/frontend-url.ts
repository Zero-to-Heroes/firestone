import { app } from 'electron';
import { existsSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { rendererAppPort } from './constants';

/**
 * Resolve the Angular frontend URL for a hash route (`overlay`, `battlegrounds`, …).
 *
 * - Packaged builds load `resources/electron-frontend/index.html` via file://.
 * - Unpacked / `ow-electron dist/...` defaults to the webpack-dev server.
 * - Set `FS_ELECTRON_FRONTEND_DIR` to an absolute (or cwd-relative) path of a built
 *   `electron-frontend` output (must contain `index.html`) to force file:// load —
 *   used to measure production frontend RSS without a full installer package.
 */
export function getElectronFrontendUrl(hashRoute: string): string {
	const route = hashRoute.replace(/^#\/?/, '').replace(/^\//, '');
	const overrideDir = process.env.FS_ELECTRON_FRONTEND_DIR?.trim();
	const useFileFrontend = app.isPackaged || !!overrideDir;

	if (!useFileFrontend) {
		return `http://localhost:${rendererAppPort}/#/${route}`;
	}

	const frontendDir = overrideDir
		? join(overrideDir) // allow relative paths from cwd
		: join(process.resourcesPath, 'electron-frontend');
	const frontendPath = join(frontendDir, 'index.html');
	if (!existsSync(frontendPath)) {
		console.error('[frontend-url] Frontend not found at:', frontendPath);
		if (overrideDir) {
			throw new Error(`FS_ELECTRON_FRONTEND_DIR set but index.html missing: ${frontendPath}`);
		}
	}

	let normalizedPath = frontendPath.replace(/\\/g, '/');
	normalizedPath = normalizedPath.replace(/^([a-z]):/i, (_: string, drive: string) => drive.toUpperCase() + ':');
	const url = `file:///${normalizedPath}#/${route}`;
	if (overrideDir) {
		console.log(`[frontend-url] FS_ELECTRON_FRONTEND_DIR → ${url}`);
	}
	return url;
}

/**
 * Static loading page (no Angular / cards DB). Lives in electron-app assets so the
 * free-build ad window does not pay the full frontend Tab RSS.
 */
export function getStaticLoadingUrl(): string {
	const htmlPath = app.isPackaged
		? join(app.getAppPath(), 'assets', 'loading', 'index.html')
		: join(__dirname, 'assets', 'loading', 'index.html');
	if (!existsSync(htmlPath)) {
		console.error('[frontend-url] Static loading page missing at:', htmlPath);
	}
	const url = pathToFileURL(htmlPath).href;
	console.log('[frontend-url] static loading →', url);
	return url;
}
