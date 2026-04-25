import { StandaloneUserService } from '@firestone/electron/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AppInjector, waitForReady, WINDOW_HANDLER_SERVICE_TOKEN } from '@firestone/shared/framework/core';
import { app, Menu, MenuItemConstructorOptions, nativeImage, shell, Tray } from 'electron';
import { join } from 'path';
import { combineLatest } from 'rxjs';
import App from '../app';
import { appAccessUnlocked$$, isAppAccessUnlocked } from './app-access-policy';

let tray: Tray | null = null;

function getTrayIconPath(fileName: string): string {
	return app.isPackaged
		? join(app.getAppPath(), 'assets', fileName)
		: join(__dirname, 'assets', fileName);
}

/** Warning icon when the app is locked; falls back to the normal tray icon if missing. */
function loadTrayNativeImage(warning: boolean) {
	const primaryName = warning ? 'tray_icon_warning.png' : 'tray_icon.png';
	const icon = nativeImage.createFromPath(getTrayIconPath(primaryName));
	if (icon.isEmpty() && warning) {
		return nativeImage.createFromPath(getTrayIconPath('tray_icon.png'));
	}
	if (icon.isEmpty()) {
		console.error('[SystemTray] Failed to load tray icon:', getTrayIconPath(primaryName));
	}
	return icon;
}

export const initSystemTray = async () => {
	const fullAppUnlocked = isAppAccessUnlocked();
	const icon = loadTrayNativeImage(!fullAppUnlocked);

	tray = new Tray(icon);
	tray.setToolTip(
		fullAppUnlocked
			? 'Firestone'
			: 'Firestone — Premium account required. Log in from the menu.',
	);

	const userService = AppInjector.get(StandaloneUserService);

	// Connect auth callbacks from deep links to the user service
	App.onAuthCallback((authData) => {
		console.log('[SystemTray] Received auth callback, forwarding to user service');
		userService.handleAuthCallback(authData);
	});

	await waitForReady(userService);

	combineLatest([userService.user$$, appAccessUnlocked$$]).subscribe(([currentUser, fullAppUnlocked]) => {
		const isLoggedIn = !!currentUser?.username;
		if (tray) {
			const img = loadTrayNativeImage(!fullAppUnlocked);
			if (!img.isEmpty()) {
				tray.setImage(img);
			}
			tray.setToolTip(
				fullAppUnlocked
					? 'Firestone'
					: 'Firestone — Premium account required. Log in from the menu.',
			);
		}

		const windowHandler = AppInjector.get(WINDOW_HANDLER_SERVICE_TOKEN);
		const prefService = AppInjector.get(PreferencesService);

		const template: MenuItemConstructorOptions[] = [
			isLoggedIn
				? {
						label: `Log out (${currentUser!.username!})`,
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
		];

		if (fullAppUnlocked) {
			template.push(
				{
					label: 'Main Window',
					click: async () => {
						console.log('[SystemTray] Main Window clicked');
						const prefs = await prefService.getPreferences();
						windowHandler.showCollectionWindow(prefs.collectionUseOverlay);
					},
				},
				{
					label: 'Settings',
					click: async () => {
						console.log('[SystemTray] Settings clicked');
						const prefs = await prefService.getPreferences();
						windowHandler.openSettingsWindow(prefs.collectionUseOverlay);
					},
				},
			);
		} else {
			template.push({
				label: 'Main window (requires Premium)',
				enabled: false,
			});
			template.push({
				label: 'Settings (requires Premium)',
				enabled: false,
			});
		}

		template.push(
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
		);

		const contextMenu = Menu.buildFromTemplate(template);
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
