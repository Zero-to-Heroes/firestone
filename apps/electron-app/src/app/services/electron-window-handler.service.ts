import { ElectronGameWindowService } from '@firestone/electron/common';
import { IBattlegroundsWindowOptions, IWindowHandlerService } from '@firestone/shared/framework/core';
import { OverlayBrowserWindow, OverlayWindowOptions } from '@overwolf/ow-electron-packages-types';
import { app, BrowserWindow, nativeImage, screen } from 'electron';
import { join } from 'path';
import App from '../app';
import { rendererAppPort } from '../constants';
import { OverlayService } from './overlay.service';

const SETTINGS_WIDTH = 700;
const SETTINGS_HEIGHT = 620;

function getAppIconPath(): string {
	return app.isPackaged
		? join(app.getAppPath(), 'assets', 'tray_icon.png')
		: join(__dirname, 'assets', 'tray_icon.png');
}

/**
 * When DevTools are opened in a separate window, set its icon to match the app.
 * Call this on a webContents before or after calling openDevTools().
 */
function setDevToolsWindowIcon(webContents: Electron.WebContents): void {
	const iconPath = getAppIconPath();
	webContents.once('devtools-opened', () => {
		const devToolsWC = webContents.devToolsWebContents;
		if (devToolsWC) {
			const devToolsWindow = BrowserWindow.fromWebContents(devToolsWC);
			if (devToolsWindow && !devToolsWindow.isDestroyed()) {
				devToolsWindow.setIcon(iconPath);
			}
		}
	});
}

/**
 * Electron implementation of window handling. Single place responsible for
 * managing windows when running in the Electron app.
 */
export class ElectronWindowHandlerService implements IWindowHandlerService {
	private settingsWindow: BrowserWindow | null = null;
	private settingsOverlayWindow: OverlayBrowserWindow | null = null;

	public toggleBattlegroundsWindow(_useOverlay: boolean, _options?: IBattlegroundsWindowOptions) {
		// To be implemented later
		console.warn('toggleBattlegroundsWindow is not implemented');
	}

	public openSettingsWindow(useOverlay: boolean): void {
		const gameWindowService = ElectronGameWindowService.getInstance();
		const gameInfo = gameWindowService.getCurrentGameInfo();
		const gameIsRunning = gameInfo != null;

		// Overlay only when user asked for overlay AND game is running; otherwise always normal window
		const effectiveUseOverlay = useOverlay && gameIsRunning;
		console.log('[ElectronWindowHandler] [settings] openSettingsWindow: effectiveUseOverlay', effectiveUseOverlay);

		if (App.isDevelopmentMode()) {
			console.log('[ElectronWindowHandler] openSettingsWindow:', {
				useOverlay,
				gameIsRunning,
				effectiveUseOverlay,
				settingsUrl: this.getSettingsLoadUrl(),
			});
		}

		if (effectiveUseOverlay) {
			this.openSettingsAsOverlay(gameInfo!.width, gameInfo!.height);
		} else {
			this.openSettingsAsNormalWindow();
		}
	}

	private openSettingsAsNormalWindow(): void {
		// If we already have an overlay settings window, close it so we only have one settings window at a time
		if (this.settingsOverlayWindow) {
			try {
				if (!this.settingsOverlayWindow.window.isDestroyed()) {
					this.settingsOverlayWindow.window.close();
				}
			} catch (_) {}
			this.settingsOverlayWindow = null;
		}

		if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
			if (this.settingsWindow.isMinimized()) {
				this.settingsWindow.restore();
			}
			this.settingsWindow.show();
			this.settingsWindow.focus();
			return;
		}

		const preloadPath = join(__dirname, 'main.preload.js');
		const windowIcon = nativeImage.createFromPath(getAppIconPath());

		this.settingsWindow = new BrowserWindow({
			width: SETTINGS_WIDTH,
			height: SETTINGS_HEIGHT,
			resizable: false,
			show: false,
			frame: false,
			title: 'Firestone Settings',
			icon: windowIcon.isEmpty() ? undefined : windowIcon,
			transparent: true,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				preload: preloadPath,
			},
		});

		this.settingsWindow.setMenu(null);
		this.settingsWindow.center();

		this.settingsWindow.once('ready-to-show', () => {
			this.settingsWindow?.show();
			this.settingsWindow?.focus();
		});

		if (App.isDevelopmentMode()) {
			setDevToolsWindowIcon(this.settingsWindow.webContents);
			this.settingsWindow.webContents.once('did-finish-load', () => {
				if (!this.settingsWindow?.isDestroyed() && !this.settingsWindow.webContents.isDevToolsOpened()) {
					this.settingsWindow.webContents.openDevTools({ mode: 'detach', activate: true });
				}
			});
		}

		this.settingsWindow.loadURL(this.getSettingsLoadUrl()).catch((err) => {
			console.error('[ElectronWindowHandler] Failed to load Settings window:', err);
		});
	}

	private async openSettingsAsOverlay(gameWidth: number, gameHeight: number): Promise<void> {
		// If we already have a normal settings window, close it
		if (this.settingsWindow) {
			try {
				if (!this.settingsWindow.isDestroyed()) {
					this.settingsWindow.close();
				}
			} catch (_) {}
			this.settingsWindow = null;
		}

		if (this.settingsOverlayWindow && !this.settingsOverlayWindow.window.isDestroyed()) {
			if (this.settingsOverlayWindow.window.isMinimized()) {
				this.settingsOverlayWindow.window.restore();
			}
			this.settingsOverlayWindow.window.show();
			this.settingsOverlayWindow.window.focus();
			return;
		}

		const overlayService = OverlayService.getInstance();
		const overlayApi = overlayService.overlayApi;
		if (!overlayApi) {
			console.warn('[ElectronWindowHandler] Overlay API not ready, opening Settings as normal window');
			this.openSettingsAsNormalWindow();
			return;
		}

		const x = Math.max(0, Math.floor(gameWidth / 2 - SETTINGS_WIDTH / 2));
		const y = Math.max(0, Math.floor(gameHeight / 2 - SETTINGS_HEIGHT / 2));

		const preloadPath = join(__dirname, 'main.preload.js');
		const options: OverlayWindowOptions & { dpiAware?: boolean } = {
			name: 'firestone-settings-' + Math.floor(Math.random() * 1000),
			width: SETTINGS_WIDTH,
			height: SETTINGS_HEIGHT,
			x,
			y,
			show: false,
			transparent: true,
			frame: false,
			resizable: false,
			roundedCorners: true,
			// DPI-aware: scales the overlay correctly on high-DPI displays (ow-electron 1.7.0+)
			dpiAware: true,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				preload: preloadPath,
			},
		};

		this.settingsOverlayWindow = await overlayApi.createWindow(options);

		this.settingsOverlayWindow.window.once('ready-to-show', () => {
			this.settingsOverlayWindow?.window.show();
			this.settingsOverlayWindow?.window.focus();
		});

		if (App.isDevelopmentMode()) {
			setDevToolsWindowIcon(this.settingsOverlayWindow.window.webContents);
			this.settingsOverlayWindow.window.webContents.once('did-finish-load', () => {
				if (
					this.settingsOverlayWindow &&
					!this.settingsOverlayWindow.window.isDestroyed() &&
					!this.settingsOverlayWindow.window.webContents.isDevToolsOpened()
				) {
					this.settingsOverlayWindow.window.webContents.openDevTools({ mode: 'detach', activate: true });
				}
			});
		}

		this.settingsOverlayWindow.window.loadURL(this.getSettingsLoadUrl()).catch((err) => {
			console.error('[ElectronWindowHandler] Failed to load Settings overlay:', err);
		});
	}

	public reloadWindows(): void {
		const browserWindows = [this.settingsWindow];
		const overlayWindows = [this.settingsOverlayWindow];
		for (const window of browserWindows) {
			if (window && !window.isDestroyed()) {
				window.reload();
			}
		}
		for (const window of overlayWindows) {
			if (window && !window.window.isDestroyed()) {
				window.window.reload();
			}
		}
	}

	public relaunchApp(): void {
		app.relaunch();
		app.exit(0);
	}

	/**
	 * Get the DPI scale factor for the display where the overlay appears.
	 * Use this when you need DPI-aware scaling (e.g. zoomFactor, layout calculations).
	 *
	 * @returns scaleFactor (e.g. 1.25 for 125% DPI scaling, 1.0 for 100%)
	 */
	private getDisplayScaleFactorForOverlay(x: number, y: number, overlayApi: any): number {
		// 1. Try to get scale from ow-electron's gameWindowInfo.screen (Display) if available
		const activeGame = overlayApi.getActiveGameInfo?.();
		const screenDisplay = activeGame?.gameWindowInfo?.screen;
		if (screenDisplay?.scaleFactor != null && screenDisplay.scaleFactor > 0) {
			return screenDisplay.scaleFactor;
		}
		// 2. Use Electron screen.getDisplayMatching with game bounds
		const bounds = activeGame?.gameWindowInfo?.bounds ?? { x, y, width: SETTINGS_WIDTH, height: SETTINGS_HEIGHT };
		try {
			const display = screen.getDisplayMatching(bounds);
			return display?.scaleFactor ?? 1;
		} catch {
			// 3. Fallback to primary display
			return screen.getPrimaryDisplay().scaleFactor;
		}
	}

	/**
	 * Build the URL for the Settings window (dev server or packaged frontend).
	 * Uses HashLocationStrategy (#/settings) so routing works with both file:// and http.
	 */
	private getSettingsLoadUrl(): string {
		if (app.isPackaged) {
			const frontendDir = join(process.resourcesPath, 'electron-frontend');
			const frontendPath = join(frontendDir, 'index.html');
			const fs = require('fs');
			if (!fs.existsSync(frontendPath)) {
				console.error('[ElectronWindowHandler] Frontend not found at:', frontendPath);
			}
			let normalizedPath = frontendPath.replace(/\\/g, '/');
			normalizedPath = normalizedPath.replace(
				/^([a-z]):/i,
				(_: string, drive: string) => drive.toUpperCase() + ':',
			);
			return `file:///${normalizedPath}#/settings`;
		}
		// Hash is required: electron-frontend uses HashLocationStrategy, so path must be in the hash
		return `http://localhost:${rendererAppPort}/#/settings`;
	}
}
