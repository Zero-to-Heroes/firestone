import { AppInjector, StandaloneUserService } from '@firestone/shared/framework/core';
import { app, Menu, nativeImage, Tray } from 'electron';
import { join } from 'path';

let tray: Tray | null = null;

export const initSystemTray = async () => {
	// Get the path to the tray icon
	// In dev: __dirname is dist/apps/electron-app, assets are in dist/apps/electron-app/assets
	// In packaged: assets are in resources/assets
	const iconPath = app.isPackaged
		? join(process.resourcesPath, 'assets', 'tray_icon.png')
		: join(__dirname, 'assets', 'tray_icon.png');

	console.log('[SystemTray] Loading icon from:', iconPath);

	const icon = nativeImage.createFromPath(iconPath);
	if (icon.isEmpty()) {
		console.error('[SystemTray] Failed to load tray icon from:', iconPath);
	}

	tray = new Tray(icon);
	tray.setToolTip('Firestone');

	const userService = AppInjector.get(StandaloneUserService);

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
