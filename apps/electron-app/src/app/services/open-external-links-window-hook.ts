import type { App, WebContents } from 'electron';
import { shell } from 'electron';

/**
 * URLs that should open in the user's default application (browser / mail client)
 * instead of navigating inside Electron. Keeps plain <a href> working without IPC from the renderer.
 */
function shouldOpenOutsideElectron(url: string): boolean {
	try {
		const { protocol } = new URL(url);
		return protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:';
	} catch {
		return false;
	}
}

/**
 * For a BrowserWindow's main frame: send http(s)/mailto navigations and new-window requests to the OS.
 */
export function attachOpenExternalNavigation(webContents: WebContents): void {
	webContents.setWindowOpenHandler(({ url }) => {
		if (shouldOpenOutsideElectron(url)) {
			void shell.openExternal(url);
			return { action: 'deny' };
		}
		return { action: 'allow' };
	});

	webContents.on('will-navigate', (event, url) => {
		if (shouldOpenOutsideElectron(url)) {
			event.preventDefault();
			void shell.openExternal(url);
		}
	});
}

/**
 * Apply to every BrowserWindow (present and future). Register once during startup, before windows are created.
 */
export function registerOpenExternalLinksForAllBrowserWindows(electronApp: App): void {
	electronApp.on('browser-window-created', (_event, browserWindow) => {
		attachOpenExternalNavigation(browserWindow.webContents);
	});
}
