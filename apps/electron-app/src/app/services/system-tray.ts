import { StandaloneUserService } from '@firestone/electron/common';
import { AppInjector, waitForReady } from '@firestone/shared/framework/core';
import { app, Menu, nativeImage, shell, Tray } from 'electron';
import { join } from 'path';
import App from '../app';

let tray: Tray | null = null;

export const initSystemTray = async () => {
	// Get the path to the tray icon
	// In dev: __dirname is dist/apps/electron-app, assets are in dist/apps/electron-app/assets
	// In packaged: assets are bundled in app.asar, so we need to use app.getAppPath()
	const iconPath = app.isPackaged
		? join(app.getAppPath(), 'assets', 'tray_icon.png')
		: join(__dirname, 'assets', 'tray_icon.png');

	console.log('[SystemTray] Loading icon from:', iconPath);

	const icon = nativeImage.createFromPath(iconPath);
	if (icon.isEmpty()) {
		console.error('[SystemTray] Failed to load tray icon from:', iconPath);
	}

	tray = new Tray(icon);
	tray.setToolTip('Firestone');

	const userService = AppInjector.get(StandaloneUserService);

	// Connect auth callbacks from deep links to the user service
	App.onAuthCallback((authData) => {
		console.log('[SystemTray] Received auth callback, forwarding to user service');
		userService.handleAuthCallback(authData);
	});

	await waitForReady(userService);

	userService.user$$.subscribe((currentUser) => {
		console.log('[SystemTray] User changed:', currentUser);
		const isLoggedIn = !!currentUser?.username;

		const contextMenu = Menu.buildFromTemplate([
			isLoggedIn
				? {
					label: `Log out (${currentUser.username})`,
					click: () => {
						console.log('[SystemTray] Log out clicked');
						userService.logout();
					},
				}
				: {
					label: 'Log in',
					click: () => {
						console.log('[SystemTray] Log in clicked');
						userService.login();
					},
				},
			{ type: 'separator' },
			{
				label: 'Open log folder',
				click: () => {
					console.log('[SystemTray] Opening log folder...');
					const logsDir = join(app.getPath('userData'), 'logs');
					shell.openPath(logsDir).catch((err) => {
						console.error('[SystemTray] Failed to open log folder:', err);
					});
				},
			},
			{
				label: 'Restart app',
				click: () => {
					console.log('[SystemTray] Restarting app...');
					app.relaunch();
					app.exit(0);
				},
			},
			{
				label: 'Exit',
				click: () => {
					console.log('[SystemTray] Exiting app...');
					app.quit();
				},
			},
		]);

		tray.setContextMenu(contextMenu);
	});

	// Optional: clicking tray icon could show/focus main window
	tray.on('click', () => {
		console.log('[SystemTray] Tray icon clicked');
	});
};

export const destroySystemTray = () => {
	if (tray) {
		tray.destroy();
		tray = null;
	}
};
