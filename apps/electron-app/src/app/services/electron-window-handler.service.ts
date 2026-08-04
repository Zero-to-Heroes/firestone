import { ElectronGameWindowService } from '@firestone/electron/common';
import { IWindowHandlerService, IWindowOptions } from '@firestone/shared/framework/core';
import { OverlayBrowserWindow, OverlayWindowOptions } from '@overwolf/ow-electron-packages-types';
import { app, BrowserWindow, nativeImage, screen } from 'electron';
import { join } from 'path';
import App from '../app';
import { getElectronFrontendUrl, getStaticLoadingUrl } from '../frontend-url';
import { isAppAccessUnlocked } from './app-access-policy';
import { OverlayService } from './overlay.service';

const SETTINGS_WIDTH = 700;
const SETTINGS_HEIGHT = 620;
const COLLECTION_WIDTH = 1440;
const COLLECTION_HEIGHT = 790;
const BATTLEGROUNDS_WIDTH = 1360;
const BATTLEGROUNDS_HEIGHT = 790;
const LOTTERY_WIDTH = 400;
const LOTTERY_HEIGHT = 400;
const LOADING_WIDTH = 440;
const LOADING_HEIGHT = 590;

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
	private collectionWindow: BrowserWindow | null = null;
	private collectionOverlayWindow: OverlayBrowserWindow | null = null;
	private battlegroundsWindow: BrowserWindow | null = null;
	private battlegroundsOverlayWindow: OverlayBrowserWindow | null = null;
	private lotteryWindow: BrowserWindow | null = null;
	private loadingOverlayWindow: OverlayBrowserWindow | null = null;
	private loadingAbilitiesReady = false;

	/**
	 * Close Battlegrounds windows when Hearthstone exits so a stuck overlay/panel
	 * cannot survive injection teardown (same zombie class as the main overlay).
	 */
	public closeBattlegroundsWindowsForGameExit(): void {
		if (this.battlegroundsWindow && !this.battlegroundsWindow.isDestroyed()) {
			try {
				this.battlegroundsWindow.close();
			} catch (_) {}
		}
		this.battlegroundsWindow = null;
		if (this.battlegroundsOverlayWindow) {
			try {
				if (!this.battlegroundsOverlayWindow.window.isDestroyed()) {
					this.battlegroundsOverlayWindow.window.close();
				}
			} catch (_) {}
			this.battlegroundsOverlayWindow = null;
		}
		console.log('[ElectronWindowHandler] Closed Battlegrounds windows on game exit');
	}

	/**
	 * Close collection/settings windows when premium access is revoked (tray, overlay, and policy).
	 */
	public closeAllWindowsForAppAccess(): void {
		this.closeLoadingWindow();
		if (this.collectionWindow && !this.collectionWindow.isDestroyed()) {
			this.collectionWindow.close();
		}
		if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
			this.settingsWindow.close();
		}
		if (this.collectionOverlayWindow) {
			try {
				if (!this.collectionOverlayWindow.window.isDestroyed()) {
					this.collectionOverlayWindow.window.close();
				}
			} catch (_) {}
			this.collectionOverlayWindow = null;
		}
		if (this.settingsOverlayWindow) {
			try {
				if (!this.settingsOverlayWindow.window.isDestroyed()) {
					this.settingsOverlayWindow.window.close();
				}
			} catch (_) {}
			this.settingsOverlayWindow = null;
		}
		if (this.battlegroundsWindow && !this.battlegroundsWindow.isDestroyed()) {
			this.battlegroundsWindow.close();
		}
		if (this.battlegroundsOverlayWindow) {
			try {
				if (!this.battlegroundsOverlayWindow.window.isDestroyed()) {
					this.battlegroundsOverlayWindow.window.close();
				}
			} catch (_) {}
			this.battlegroundsOverlayWindow = null;
		}
		if (this.lotteryWindow && !this.lotteryWindow.isDestroyed()) {
			this.lotteryWindow.close();
		}
	}

	public toggleCollectionWindow(useOverlay: boolean): void {
		const gameWindowService = ElectronGameWindowService.getInstance();
		const gameInfo = gameWindowService.getCurrentGameInfo();
		const gameIsRunning = gameInfo != null;
		const effectiveUseOverlay = useOverlay && gameIsRunning;

		if (effectiveUseOverlay) {
			// Overlay mode: toggle the overlay window
			if (this.collectionOverlayWindow && !this.collectionOverlayWindow.window.isDestroyed()) {
				// Window exists and is open — close it
				this.collectionOverlayWindow.window.close();
				this.collectionOverlayWindow = null;
			} else {
				// Window doesn't exist or was destroyed — show it
				this.showCollectionWindow(useOverlay);
			}
		} else {
			// Normal window mode: toggle the BrowserWindow
			if (this.collectionWindow && !this.collectionWindow.isDestroyed()) {
				if (this.collectionWindow.isVisible()) {
					// Window is visible — close it
					this.collectionWindow.close();
				} else {
					// Window exists but is hidden — show it
					this.collectionWindow.show();
					this.collectionWindow.focus();
				}
			} else {
				// Window doesn't exist — create & show it
				this.showCollectionWindow(useOverlay);
			}
		}
	}

	public toggleBattlegroundsWindow(useOverlay: boolean, options?: IWindowOptions): void {
		const forcedStatus = options?.forced ?? null;
		const canBringUpFromMinimized = options?.canBringUpFromMinimized ?? true;

		const gameWindowService = ElectronGameWindowService.getInstance();
		const gameInfo = gameWindowService.getCurrentGameInfo();
		const gameIsRunning = gameInfo != null;
		const effectiveUseOverlay = useOverlay && gameIsRunning;

		if (effectiveUseOverlay) {
			this.toggleBattlegroundsOverlayWindow(
				forcedStatus,
				canBringUpFromMinimized,
				gameInfo!.width,
				gameInfo!.height,
			);
		} else {
			this.toggleBattlegroundsNormalWindow(forcedStatus, canBringUpFromMinimized, useOverlay);
		}
	}

	private toggleBattlegroundsNormalWindow(
		forcedStatus: 'open' | 'closed' | null,
		canBringUpFromMinimized: boolean,
		useOverlay: boolean,
	): void {
		if (this.battlegroundsOverlayWindow) {
			try {
				if (!this.battlegroundsOverlayWindow.window.isDestroyed()) {
					this.battlegroundsOverlayWindow.window.close();
				}
			} catch (_) {}
			this.battlegroundsOverlayWindow = null;
		}

		const existingWindow = this.getExistingBattlegroundsWindow();

		if (forcedStatus === 'open') {
			if (!isAppAccessUnlocked()) {
				console.log('[ElectronWindowHandler] Battlegrounds window blocked — full app not unlocked');
				return;
			}
			if (existingWindow) {
				// Minimize may be OS-minimized or hidden; treat both as user-dismissed.
				if (!canBringUpFromMinimized && this.isWindowUserDismissed(existingWindow)) {
					return;
				}
				this.showExistingBattlegroundsWindow(existingWindow);
			} else {
				this.showBattlegroundsWindow(useOverlay);
			}
			return;
		}

		if (forcedStatus === 'closed') {
			if (existingWindow && !existingWindow.isDestroyed()) {
				existingWindow.close();
			}
			return;
		}

		if (existingWindow) {
			if (existingWindow.isVisible()) {
				existingWindow.close();
			} else {
				if (!canBringUpFromMinimized && this.isWindowUserDismissed(existingWindow)) {
					return;
				}
				if (!isAppAccessUnlocked()) {
					console.log('[ElectronWindowHandler] Battlegrounds window blocked — full app not unlocked');
					return;
				}
				this.showExistingBattlegroundsWindow(existingWindow);
			}
		} else {
			this.showBattlegroundsWindow(useOverlay);
		}
	}

	private toggleBattlegroundsOverlayWindow(
		forcedStatus: 'open' | 'closed' | null,
		canBringUpFromMinimized: boolean,
		gameWidth: number,
		gameHeight: number,
	): void {
		if (this.battlegroundsWindow) {
			try {
				if (!this.battlegroundsWindow.isDestroyed()) {
					this.battlegroundsWindow.close();
				}
			} catch (_) {}
			this.battlegroundsWindow = null;
		}

		const existingOverlay = this.battlegroundsOverlayWindow;
		const overlayExists = existingOverlay && !existingOverlay.window.isDestroyed();

		if (forcedStatus === 'open') {
			if (!isAppAccessUnlocked()) {
				console.log('[ElectronWindowHandler] Battlegrounds window blocked — full app not unlocked');
				return;
			}
			if (overlayExists) {
				// Minimize may be OS-minimized or hidden; treat both as user-dismissed.
				if (!canBringUpFromMinimized && this.isWindowUserDismissed(existingOverlay!.window)) {
					return;
				}
				if (existingOverlay!.window.isMinimized()) {
					existingOverlay!.window.restore();
				}
				existingOverlay!.window.show();
				existingOverlay!.window.focus();
			} else {
				void this.openBattlegroundsAsOverlay(gameWidth, gameHeight);
			}
			return;
		}

		if (forcedStatus === 'closed') {
			if (overlayExists) {
				existingOverlay!.window.close();
				this.battlegroundsOverlayWindow = null;
			}
			return;
		}

		if (overlayExists) {
			existingOverlay!.window.close();
			this.battlegroundsOverlayWindow = null;
		} else {
			this.showBattlegroundsWindow(true);
		}
	}

	public showBattlegroundsWindow(useOverlay: boolean): void {
		if (!isAppAccessUnlocked()) {
			console.log('[ElectronWindowHandler] Battlegrounds window blocked — full app not unlocked');
			return;
		}
		const gameWindowService = ElectronGameWindowService.getInstance();
		const gameInfo = gameWindowService.getCurrentGameInfo();
		const gameIsRunning = gameInfo != null;
		const effectiveUseOverlay = useOverlay && gameIsRunning;

		if (effectiveUseOverlay) {
			void this.openBattlegroundsAsOverlay(gameInfo!.width, gameInfo!.height);
		} else {
			this.openBattlegroundsAsNormalWindow();
		}
	}

	private openBattlegroundsAsNormalWindow(): void {
		if (this.battlegroundsOverlayWindow) {
			try {
				if (!this.battlegroundsOverlayWindow.window.isDestroyed()) {
					this.battlegroundsOverlayWindow.window.close();
				}
			} catch (_) {}
			this.battlegroundsOverlayWindow = null;
		}

		const existingBattlegroundsWindow = this.getExistingBattlegroundsWindow();
		if (existingBattlegroundsWindow) {
			this.showExistingBattlegroundsWindow(existingBattlegroundsWindow);
			return;
		}

		const preloadPath = join(__dirname, 'main.preload.js');
		const windowIcon = nativeImage.createFromPath(getAppIconPath());

		this.battlegroundsWindow = new BrowserWindow({
			width: BATTLEGROUNDS_WIDTH,
			height: BATTLEGROUNDS_HEIGHT,
			minWidth: BATTLEGROUNDS_WIDTH,
			minHeight: BATTLEGROUNDS_HEIGHT,
			resizable: true,
			show: false,
			frame: false,
			title: 'Firestone Battlegrounds',
			icon: windowIcon.isEmpty() ? undefined : windowIcon,
			transparent: true,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				preload: preloadPath,
			},
		});

		this.battlegroundsWindow.setMenu(null);
		this.battlegroundsWindow.center();

		this.battlegroundsWindow.once('closed', () => {
			this.battlegroundsWindow = null;
		});

		this.battlegroundsWindow.once('ready-to-show', () => {
			this.battlegroundsWindow?.show();
			this.battlegroundsWindow?.focus();
		});

		if (App.isDevelopmentMode()) {
			setDevToolsWindowIcon(this.battlegroundsWindow.webContents);
			this.battlegroundsWindow.webContents.once('did-finish-load', () => {
				if (
					!this.battlegroundsWindow?.isDestroyed() &&
					!this.battlegroundsWindow.webContents.isDevToolsOpened()
				) {
					this.battlegroundsWindow.webContents.openDevTools({ mode: 'detach', activate: true });
				}
			});
		}

		this.battlegroundsWindow.loadURL(this.getBattlegroundsLoadUrl()).catch((err) => {
			console.error('[ElectronWindowHandler] Failed to load battlegrounds window:', err);
		});
	}

	/** Treat OS-minimized or hidden windows as user-dismissed for auto-open. */
	private isWindowUserDismissed(window: BrowserWindow): boolean {
		return window.isMinimized() || !window.isVisible();
	}

	private getExistingBattlegroundsWindow(): BrowserWindow | null {
		if (this.battlegroundsWindow && !this.battlegroundsWindow.isDestroyed()) {
			return this.battlegroundsWindow;
		}

		const existingBattlegroundsWindow = BrowserWindow.getAllWindows().find((window) => {
			if (window.isDestroyed()) {
				return false;
			}

			return window.webContents.getURL().includes('#/battlegrounds');
		});
		this.battlegroundsWindow = existingBattlegroundsWindow ?? null;
		return this.battlegroundsWindow;
	}

	private showExistingBattlegroundsWindow(battlegroundsWindow: BrowserWindow): void {
		if (battlegroundsWindow.isMinimized()) {
			battlegroundsWindow.restore();
		}
		battlegroundsWindow.show();
		battlegroundsWindow.focus();
	}

	private async openBattlegroundsAsOverlay(gameWidth: number, gameHeight: number): Promise<void> {
		if (!isAppAccessUnlocked()) {
			return;
		}
		if (this.battlegroundsWindow) {
			try {
				if (!this.battlegroundsWindow.isDestroyed()) {
					this.battlegroundsWindow.close();
				}
			} catch (_) {}
			this.battlegroundsWindow = null;
		}

		if (this.battlegroundsOverlayWindow && !this.battlegroundsOverlayWindow.window.isDestroyed()) {
			if (this.battlegroundsOverlayWindow.window.isMinimized()) {
				this.battlegroundsOverlayWindow.window.restore();
			}
			this.battlegroundsOverlayWindow.window.show();
			this.battlegroundsOverlayWindow.window.focus();
			return;
		}

		const overlayService = OverlayService.getInstance();
		const overlayApi = overlayService.overlayApi;
		if (!overlayApi) {
			console.warn('[ElectronWindowHandler] Overlay API not ready, opening Battlegrounds as normal window');
			this.openBattlegroundsAsNormalWindow();
			return;
		}

		const x = Math.max(0, Math.floor(gameWidth / 2 - BATTLEGROUNDS_WIDTH / 2));
		const y = Math.max(0, Math.floor(gameHeight / 2 - BATTLEGROUNDS_HEIGHT / 2));

		const preloadPath = join(__dirname, 'main.preload.js');
		const options: OverlayWindowOptions & { dpiAware?: boolean } = {
			name: 'firestone-battlegrounds-' + Math.floor(Math.random() * 1000),
			width: BATTLEGROUNDS_WIDTH,
			height: BATTLEGROUNDS_HEIGHT,
			x,
			y,
			show: false,
			transparent: true,
			frame: false,
			resizable: true,
			roundedCorners: true,
			dpiAware: true,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				preload: preloadPath,
			},
		};

		this.battlegroundsOverlayWindow = await overlayApi.createWindow(options);

		this.battlegroundsOverlayWindow.window.once('closed', () => {
			this.battlegroundsOverlayWindow = null;
		});

		this.battlegroundsOverlayWindow.window.once('ready-to-show', () => {
			this.battlegroundsOverlayWindow?.window.show();
			this.battlegroundsOverlayWindow?.window.focus();
		});

		if (App.isDevelopmentMode()) {
			setDevToolsWindowIcon(this.battlegroundsOverlayWindow.window.webContents);
			this.battlegroundsOverlayWindow.window.webContents.once('did-finish-load', () => {
				if (
					this.battlegroundsOverlayWindow &&
					!this.battlegroundsOverlayWindow.window.isDestroyed() &&
					!this.battlegroundsOverlayWindow.window.webContents.isDevToolsOpened()
				) {
					this.battlegroundsOverlayWindow.window.webContents.openDevTools({ mode: 'detach', activate: true });
				}
			});
		}

		this.battlegroundsOverlayWindow.window.loadURL(this.getBattlegroundsLoadUrl()).catch((err) => {
			console.error('[ElectronWindowHandler] Failed to load Battlegrounds overlay:', err);
		});
	}

	public showCollectionWindow(useOverlay: boolean): void {
		if (!isAppAccessUnlocked()) {
			console.log('[ElectronWindowHandler] Main window blocked — full app not unlocked');
			return;
		}
		this.closeLoadingWindow();
		const gameWindowService = ElectronGameWindowService.getInstance();
		const gameInfo = gameWindowService.getCurrentGameInfo();
		const gameIsRunning = gameInfo != null;
		// Overlay only when user asked for overlay AND game is running; otherwise always normal window
		const effectiveUseOverlay = useOverlay && gameIsRunning;

		if (effectiveUseOverlay) {
			this.openCollectionAsOverlay(gameInfo!.width, gameInfo!.height);
		} else {
			this.openCollectionAsNormalWindow();
		}
	}
	private openCollectionAsNormalWindow(): void {
		// If we already have an overlay collection window, close it so we only have one collection window at a time
		if (this.collectionOverlayWindow) {
			try {
				if (!this.collectionOverlayWindow.window.isDestroyed()) {
					this.collectionOverlayWindow.window.close();
				}
			} catch (_) {}
			this.collectionOverlayWindow = null;
		}

		const existingCollectionWindow = this.getExistingCollectionWindow();
		if (existingCollectionWindow) {
			this.showExistingCollectionWindow(existingCollectionWindow);
			return;
		}

		const preloadPath = join(__dirname, 'main.preload.js');
		const windowIcon = nativeImage.createFromPath(getAppIconPath());

		this.collectionWindow = new BrowserWindow({
			width: COLLECTION_WIDTH,
			height: COLLECTION_HEIGHT,
			resizable: true,
			show: false,
			frame: false,
			title: 'Firestone Collection',
			icon: windowIcon.isEmpty() ? undefined : windowIcon,
			transparent: true,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				preload: preloadPath,
			},
		});

		this.collectionWindow.setMenu(null);
		this.collectionWindow.center();

		this.collectionWindow.once('closed', () => {
			this.collectionWindow = null;
		});

		this.collectionWindow.once('ready-to-show', () => {
			this.collectionWindow?.show();
			this.collectionWindow?.focus();
		});

		if (App.isDevelopmentMode()) {
			setDevToolsWindowIcon(this.collectionWindow.webContents);
			this.collectionWindow.webContents.once('did-finish-load', () => {
				if (!this.collectionWindow?.isDestroyed() && !this.collectionWindow.webContents.isDevToolsOpened()) {
					this.collectionWindow.webContents.openDevTools({ mode: 'detach', activate: true });
				}
			});
		}

		this.collectionWindow.loadURL(this.getCollectionLoadUrl()).catch((err) => {
			console.error('[ElectronWindowHandler] Failed to load collection window:', err);
		});
	}

	private getExistingCollectionWindow(): BrowserWindow | null {
		if (this.collectionWindow && !this.collectionWindow.isDestroyed()) {
			return this.collectionWindow;
		}

		const existingCollectionWindow = BrowserWindow.getAllWindows().find((window) => {
			if (window.isDestroyed()) {
				return false;
			}

			return window.webContents.getURL().includes('#/collection');
		});
		this.collectionWindow = existingCollectionWindow ?? null;
		return this.collectionWindow;
	}

	private showExistingCollectionWindow(collectionWindow: BrowserWindow): void {
		if (collectionWindow.isMinimized()) {
			collectionWindow.restore();
		}
		collectionWindow.show();
		collectionWindow.focus();
	}

	private openCollectionAsOverlay(gameWidth: number, gameHeight: number): void {
		// To be implemented later
		console.warn('openCollectionAsOverlay is not implemented');
	}

	public openSettingsWindow(useOverlay: boolean): void {
		if (!isAppAccessUnlocked()) {
			console.log('[ElectronWindowHandler] Settings blocked — full app not unlocked');
			return;
		}
		const gameWindowService = ElectronGameWindowService.getInstance();
		const gameInfo = gameWindowService.getCurrentGameInfo();
		const gameIsRunning = gameInfo != null;
		// Overlay only when user asked for overlay AND game is running; otherwise always normal window
		const effectiveUseOverlay = useOverlay && gameIsRunning;

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

		this.settingsWindow.once('closed', () => {
			this.settingsWindow = null;
		});

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
		if (!isAppAccessUnlocked()) {
			return;
		}
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

		this.settingsOverlayWindow.window.once('closed', () => {
			this.settingsOverlayWindow = null;
		});

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

	public showLotteryWindow(): void {
		const existingLotteryWindow = this.getExistingLotteryWindow();
		if (existingLotteryWindow) {
			this.showExistingLotteryWindow(existingLotteryWindow);
			return;
		}

		const preloadPath = join(__dirname, 'main.preload.js');
		const windowIcon = nativeImage.createFromPath(getAppIconPath());

		this.lotteryWindow = new BrowserWindow({
			width: LOTTERY_WIDTH,
			height: LOTTERY_HEIGHT,
			minWidth: LOTTERY_WIDTH,
			minHeight: LOTTERY_HEIGHT,
			maxWidth: LOTTERY_WIDTH,
			maxHeight: LOTTERY_HEIGHT,
			resizable: false,
			show: false,
			frame: false,
			title: 'Firestone Lottery',
			icon: windowIcon.isEmpty() ? undefined : windowIcon,
			transparent: true,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				preload: preloadPath,
			},
		});

		this.lotteryWindow.setMenu(null);
		this.lotteryWindow.center();

		this.lotteryWindow.once('closed', () => {
			this.lotteryWindow = null;
		});

		this.lotteryWindow.once('ready-to-show', () => {
			this.lotteryWindow?.show();
			this.lotteryWindow?.focus();
		});

		if (App.isDevelopmentMode()) {
			setDevToolsWindowIcon(this.lotteryWindow.webContents);
			this.lotteryWindow.webContents.once('did-finish-load', () => {
				if (!this.lotteryWindow?.isDestroyed() && !this.lotteryWindow.webContents.isDevToolsOpened()) {
					this.lotteryWindow.webContents.openDevTools({ mode: 'detach', activate: true });
				}
			});
		}

		this.lotteryWindow.loadURL(this.getLotteryLoadUrl()).catch((err) => {
			console.error('[ElectronWindowHandler] Failed to load lottery window:', err);
		});
	}

	public closeLotteryWindow(): void {
		if (this.lotteryWindow && !this.lotteryWindow.isDestroyed()) {
			this.lotteryWindow.close();
		}
		this.lotteryWindow = null;
	}

	public isCollectionWindowVisible(): boolean {
		if (this.collectionWindow && !this.collectionWindow.isDestroyed() && this.collectionWindow.isVisible()) {
			return true;
		}
		if (
			this.collectionOverlayWindow &&
			!this.collectionOverlayWindow.window.isDestroyed() &&
			this.collectionOverlayWindow.window.isVisible()
		) {
			return true;
		}
		return false;
	}

	public isLoadingWindowOpen(): boolean {
		return !!this.loadingOverlayWindow && !this.loadingOverlayWindow.window.isDestroyed();
	}

	/**
	 * Opens the loading window as an injected overlay only.
	 * @returns false if the overlay API is not ready yet (caller should retry later).
	 */
	public async showLoadingWindow(): Promise<boolean> {
		if (this.isLoadingWindowOpen()) {
			const existingOverlay = this.loadingOverlayWindow!;
			if (existingOverlay.window.isMinimized()) {
				existingOverlay.window.restore();
			}
			existingOverlay.window.show();
			existingOverlay.window.focus();
			return true;
		}

		return this.openLoadingAsOverlay();
	}

	public isLoadingAbilitiesReady(): boolean {
		return this.loadingAbilitiesReady;
	}

	public resetLoadingAbilitiesReady(): void {
		this.loadingAbilitiesReady = false;
	}

	public notifyLoadingWindowReady(): void {
		this.loadingAbilitiesReady = true;
		const webContents = this.getLoadingWebContents();
		if (webContents && !webContents.isDestroyed()) {
			webContents.send('loading-ready');
		}
	}

	public closeLoadingWindow(): void {
		if (this.loadingOverlayWindow) {
			try {
				if (!this.loadingOverlayWindow.window.isDestroyed()) {
					this.loadingOverlayWindow.window.close();
				}
			} catch (_) {}
			this.loadingOverlayWindow = null;
		}
	}

	private getLoadingWebContents(): Electron.WebContents | null {
		if (this.loadingOverlayWindow && !this.loadingOverlayWindow.window.isDestroyed()) {
			return this.loadingOverlayWindow.window.webContents;
		}
		return null;
	}

	private async openLoadingAsOverlay(): Promise<boolean> {
		const overlayService = OverlayService.getInstance();
		const overlayApi = overlayService.overlayApi;
		if (!overlayApi) {
			console.log('[ElectronWindowHandler] Overlay API not ready for loading window');
			return false;
		}

		const gameWindowService = ElectronGameWindowService.getInstance();
		const gameInfo = gameWindowService.getCurrentGameInfo();
		const gameWidth = gameInfo?.logicalWidth ?? gameInfo?.width ?? 1920;
		const gameHeight = gameInfo?.logicalHeight ?? gameInfo?.height ?? 1080;
		const x = Math.max(0, ~~(gameWidth * 0.4) - LOADING_WIDTH);
		const y = Math.max(0, ~~(gameHeight * 0.1));

		const preloadPath = join(__dirname, 'main.preload.js');
		const options: OverlayWindowOptions & { dpiAware?: boolean } = {
			name: 'firestone-loading-' + Math.floor(Math.random() * 1000),
			width: LOADING_WIDTH,
			height: LOADING_HEIGHT,
			x,
			y,
			show: false,
			transparent: true,
			frame: false,
			resizable: false,
			dpiAware: true,
			// Stay above the fullscreen HUD (esp. shared-texture passThroughAndNotify)
			// and always capture clicks on 2.0.x (no alpha-hit-test surprises).
			zOrder: 'topMost',
			passthrough: 'noPassThrough',
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
				preload: preloadPath,
				backgroundThrottling: false,
			},
		};

		try {
			this.loadingOverlayWindow = await overlayApi.createWindow(options);
		} catch (err) {
			console.error('[ElectronWindowHandler] Failed to create loading overlay:', err);
			return false;
		}

		this.loadingOverlayWindow.window.once('closed', () => {
			this.loadingOverlayWindow = null;
		});

		this.loadingOverlayWindow.window.once('ready-to-show', () => {
			this.loadingOverlayWindow?.window.show();
			this.loadingOverlayWindow?.window.focus();
		});

		this.loadingOverlayWindow.window.webContents.once('did-finish-load', () => {
			if (this.loadingAbilitiesReady) {
				this.notifyLoadingWindowReady();
			}
			if (App.isDevelopmentMode()) {
				setDevToolsWindowIcon(this.loadingOverlayWindow!.window.webContents);
				if (
					this.loadingOverlayWindow &&
					!this.loadingOverlayWindow.window.isDestroyed() &&
					!this.loadingOverlayWindow.window.webContents.isDevToolsOpened()
				) {
					// activate:false — activating DevTools here was starving the main
					// fullscreen overlay's 41MB webpack load (multi-minute DOM-ready).
					this.loadingOverlayWindow.window.webContents.openDevTools({ mode: 'detach', activate: false });
				}
			}
		});

		this.loadingOverlayWindow.window.loadURL(this.getLoadingLoadUrl()).catch((err) => {
			console.error('[ElectronWindowHandler] Failed to load loading overlay:', err);
		});
		return true;
	}

	private getExistingLotteryWindow(): BrowserWindow | null {
		if (this.lotteryWindow && !this.lotteryWindow.isDestroyed()) {
			return this.lotteryWindow;
		}

		const existingLotteryWindow = BrowserWindow.getAllWindows().find((window) => {
			if (window.isDestroyed()) {
				return false;
			}

			return window.webContents.getURL().includes('#/lottery');
		});
		this.lotteryWindow = existingLotteryWindow ?? null;
		return this.lotteryWindow;
	}

	private showExistingLotteryWindow(lotteryWindow: BrowserWindow): void {
		if (lotteryWindow.isMinimized()) {
			lotteryWindow.restore();
		}
		lotteryWindow.show();
		lotteryWindow.focus();
	}

	public reloadWindows(): void {
		const browserWindows = [this.settingsWindow, this.battlegroundsWindow, this.lotteryWindow];
		const overlayWindows = [this.settingsOverlayWindow, this.battlegroundsOverlayWindow, this.loadingOverlayWindow];
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

	private getCollectionLoadUrl(): string {
		return getElectronFrontendUrl('collection');
	}

	/**
	 * Build the URL for the Settings window (dev server or packaged frontend).
	 * Uses HashLocationStrategy (#/settings) so routing works with both file:// and http.
	 */
	private getSettingsLoadUrl(): string {
		return getElectronFrontendUrl('settings');
	}

	private getBattlegroundsLoadUrl(): string {
		return getElectronFrontendUrl('battlegrounds');
	}

	private getLotteryLoadUrl(): string {
		return getElectronFrontendUrl('lottery');
	}

	private getLoadingLoadUrl(): string {
		// Static HTML + owadview — avoids loading Angular + cards DB (~170–300 MB Tab RSS).
		return getStaticLoadingUrl();
	}
}
