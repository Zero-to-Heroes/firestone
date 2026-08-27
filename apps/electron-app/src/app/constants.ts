import { app as electronApp } from 'electron';
import { existsSync } from 'fs';
import { join } from 'path';

export const rendererAppPort = 4200;
export const rendererAppName = 'apps/electron-frontend'; // options.name.split('-')[0] + '-web'
export const electronAppName = 'electron-app';
// Note: electron-updater reads the update server URL from electron-builder.yml publish configuration
// This constant is kept for reference but is not used by the auto-updater
export const updateServerUrl = 'https://deployment-server-url.com'; // Not used - configure publish in electron-builder.yml instead

/**
 * Resolves the URL for a frontend route.
 *
 * Packaged builds read the frontend from resources. Unpackaged builds prefer the `nx serve` dev
 * server, but fall back to the built frontend next to the main process bundle: running
 * `nx build electron-frontend` and then launching electron directly (no dev server) is the normal
 * way to use the app on Linux, and without this fallback every window fails with
 * ERR_CONNECTION_REFUSED and renders nothing.
 */
export const rendererUrl = (route: string): string => {
	const fileUrl = (dir: string) => `file:///${join(dir, 'index.html').replace(/\\/g, '/')}#${route}`;
	if (electronApp.isPackaged) {
		return fileUrl(join(process.resourcesPath, 'electron-frontend'));
	}
	// __dirname is dist/apps/electron-app; the frontend build sits beside it.
	const builtDir = join(__dirname, '..', 'electron-frontend');
	if (existsSync(join(builtDir, 'index.html'))) {
		return fileUrl(builtDir);
	}
	return `http://localhost:${rendererAppPort}/#${route}`;
};
