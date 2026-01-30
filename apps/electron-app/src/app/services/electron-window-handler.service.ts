import { ElectronGameWindowService } from '@firestone/electron/common';
import { IBattlegroundsWindowOptions, IWindowHandlerService } from '@firestone/shared/framework/core';
import { OverlayBrowserWindow, OverlayWindowOptions } from '@overwolf/ow-electron-packages-types';
import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import App from '../app';
import { rendererAppPort } from '../constants';
import { OverlayService } from './overlay.service';

const SETTINGS_WIDTH = 700;
const SETTINGS_HEIGHT = 620;

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
		this.settingsWindow = new BrowserWindow({
			width: SETTINGS_WIDTH,
			height: SETTINGS_HEIGHT,
			resizable: false,
			show: false,
			title: 'Firestone Settings',
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
		const options: OverlayWindowOptions = {
			name: 'firestone-settings-' + Math.floor(Math.random() * 1000),
			width: SETTINGS_WIDTH,
			height: SETTINGS_HEIGHT,
			x,
			y,
			show: false,
			transparent: false,
			resizable: false,
			webPreferences: {
				contextIsolation: true,
				backgroundThrottling: false,
				preload: preloadPath,
			},
		};

		this.settingsOverlayWindow = await overlayApi.createWindow(options);

		this.settingsOverlayWindow.window.once('ready-to-show', () => {
			this.settingsOverlayWindow?.window.show();
			this.settingsOverlayWindow?.window.focus();
		});

		if (App.isDevelopmentMode()) {
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
