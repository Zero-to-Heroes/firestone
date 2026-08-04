/// <reference types="@overwolf/ow-electron/mix" />
import { ElectronGameWindowService } from '@firestone/electron/common';
import { NotificationsService, StandaloneAdService } from '@firestone/shared/common/service';
import { AppInjector, ILocalizationService } from '@firestone/shared/framework/core';
import {
	GamesFilter,
	IOverwolfOverlayApi,
	OverlayBrowserWindow,
	OverlayWindowOptions,
} from '@overwolf/ow-electron-packages-types';
import { app as electronApp } from 'electron';
import EventEmitter from 'events';
import { join } from 'path';
import { Subscription } from 'rxjs';
import App from '../app';
import { formatLogArg } from '../format-log-arg';
import { getElectronFrontendUrl } from '../frontend-url';
import { appAccessUnlocked$$, isAppAccessUnlocked } from './app-access-policy';

// Electron.App is augmented by @overwolf/ow-electron/mix (app.overwolf).
const app = electronApp;

export class OverlayService extends EventEmitter {
	private static instance: OverlayService;
	private isOverlayReady = false;
	private overlayPackageVersion: string | null = null;
	private overlayWindow: OverlayBrowserWindow | null = null;
	/** True when overlay was created with the Overwolf shared-texture hit-test workaround. */
	private sharedTextureHitTestWorkaround = false;
	private gameWindowService: ElectronGameWindowService;
	private appAccessSubscription: Subscription | null = null;

	public get overlayApi(): IOverwolfOverlayApi {
		// Do not let the application access the overlay before it is ready
		if (!this.isOverlayReady) {
			return null;
		}
		return (app.overwolf.packages as any).overlay as IOverwolfOverlayApi;
	}

	private constructor() {
		super();
		this.gameWindowService = ElectronGameWindowService.getInstance();
		this.startOverlayWhenPackageReady();
	}

	public static getInstance(): OverlayService {
		if (!OverlayService.instance) {
			OverlayService.instance = new OverlayService();
		}
		return OverlayService.instance;
	}

	/**
	 * Show the Hello World overlay when Hearthstone is detected
	 * Note: This is now handled automatically by the game-launched event
	 */
	public async showOverlay(): Promise<void> {
		console.log('ℹ️ Overlay creation is now handled automatically when Hearthstone launches');
	}

	/**
	 * Hide the overlay
	 */
	public async hideOverlay(): Promise<void> {
		if (this.overlayWindow) {
			// Note: The overlay window will be automatically hidden when game closes
			// due to ow-electron's injection system
			console.log('🙈 Overlay will be hidden with game');
		}
	}

	/**
	 * Destroy the overlay.
	 * Must be called on game-exit: ow-electron can leave a non-destroyed BrowserWindow
	 * whose render frame is already disposed (zombie overlay — visible but dead).
	 */
	public async destroyOverlay(): Promise<void> {
		if (!this.overlayWindow) {
			return;
		}
		const window = this.overlayWindow.window;
		this.overlayWindow = null;
		this.sharedTextureHitTestWorkaround = false;
		try {
			if (window && !window.isDestroyed()) {
				window.close();
			}
		} catch (error) {
			console.warn('[Overlay] Error destroying overlay window:', error);
		}
		console.log('💥 Overlay destroyed');
	}

	/**
	 * Check if overlay is visible
	 */
	public isOverlayVisible(): boolean {
		return this.overlayWindow !== null;
	}

	/**
	 * Whether the main in-game overlay uses the shared-texture hit-test workaround
	 * (`passThroughAndNotify` + per-widget capture). Renderer should poll this and
	 * drive setOverlayPassthrough on mouseenter/leave of interactive UI.
	 */
	public isSharedTextureHitTestWorkaroundActive(): boolean {
		return this.sharedTextureHitTestWorkaround && !!this.overlayWindow;
	}

	/**
	 * Runtime passthrough toggle for the main overlay (Overwolf shared-texture workaround).
	 * @see https://dev.overwolf.com/ow-electron/reference/examples/overlay/shared-texture-rendering/#beta-limitation-hit-testing-ignores-transparent-pixels
	 */
	public setOverlayPassthrough(mode: 'noPassThrough' | 'passThrough' | 'passThroughAndNotify'): void {
		if (!this.sharedTextureHitTestWorkaround) {
			return;
		}
		if (!this.overlayWindow?.window || this.overlayWindow.window.isDestroyed()) {
			return;
		}
		try {
			this.overlayWindow.overlayOptions.passthrough = mode;
			// Shared-texture + pass-through leaves the game cursor drawn. Focusing the
			// overlay while widgets capture input lets Chromium show a normal OS cursor.
			if (mode === 'noPassThrough') {
				this.overlayWindow.window.focus();
			}
			console.debug('[Overlay] passthrough →', mode, {
				focused: this.overlayWindow.window.isFocused(),
			});
		} catch (error) {
			console.warn('[Overlay] Failed to set passthrough=', mode, error);
		}
	}

	/**
	 * Returns true if we should create an overlay (none, destroyed, or zombie with disposed frame).
	 * Clears the stale reference before returning true.
	 */
	private shouldCreateOverlay(): boolean {
		if (!this.overlayWindow) {
			console.log('shouldCreateOverlay: no overlay window');
			return true;
		}
		if (this.isOverlayWindowUnhealthy()) {
			console.log('shouldCreateOverlay: overlay window unhealthy, destroying before recreate');
			void this.destroyOverlay();
			return true;
		}
		return false;
	}

	/**
	 * Detect zombie overlays: BrowserWindow may still exist after injection teardown
	 * while webContents / render frame are already gone.
	 */
	private isOverlayWindowUnhealthy(): boolean {
		try {
			const window = this.overlayWindow?.window;
			if (!window || window.isDestroyed()) {
				return true;
			}
			const webContents = window.webContents;
			if (!webContents || webContents.isDestroyed()) {
				return true;
			}
			// Probe: disposed frames can throw even when isDestroyed() is false
			webContents.getURL();
			return false;
		} catch (error) {
			console.log('shouldCreateOverlay: overlay probe failed, treating as unhealthy', error);
			return true;
		}
	}

	/**
	 * Register to monitor Hearthstone (game ID 9898)
	 */
	public async registerToHearthstone(): Promise<void> {
		if (!this.overlayApi) {
			console.log('Cannot register to Hearthstone - overlay API not ready');
			return;
		}

		console.log('🎮 Registering to monitor Hearthstone...');
		const filter: GamesFilter = {
			gamesIds: [9898], // Hearthstone game ID
		};

		await this.overlayApi.registerGames(filter);
		console.log('Registered to monitor Hearthstone');
	}

	/**
	 * Resize existing overlay window to match current game size
	 */
	private async resizeOverlayToGame(): Promise<void> {
		if (!isAppAccessUnlocked()) {
			return;
		}
		if (!this.overlayWindow) {
			console.log('No overlay window to resize');
			return;
		}

		// Get current game info from centralized service
		const gameInfo = this.gameWindowService.getCurrentGameInfo();
		// console.log(`Resizing - Game info from service:`, gameInfo);

		if (!gameInfo) {
			console.log(`No game info available for resize, keeping current size`);
			return;
		}

		const gameWidth = gameInfo.width;
		const gameHeight = gameInfo.height;

		// Resize the existing window
		try {
			this.overlayWindow.window.setSize(gameWidth, gameHeight);
			this.overlayWindow.window.setPosition(0, 0);
			this.overlayWindow.window.show(); // Make sure it's visible
			// console.log(`Overlay resized to: ${gameWidth}x${gameHeight}`);
		} catch (error) {
			console.error('Failed to resize overlay window:', error);
		}
	}

	/**
	 * Create the Hello World overlay window
	 */
	private async createOverlayWindow(): Promise<void> {
		if (!isAppAccessUnlocked()) {
			console.log('[Overlay] Skipping overlay window — full app not unlocked (premium + login required)');
			return;
		}
		// Get game window information from centralized service
		const gameInfo = this.gameWindowService.getCurrentGameInfo();
		console.debug(`Creating overlay - Game info from service:`, gameInfo);

		// Use game dimensions or fallback to defaults
		let gameWidth = 1920;
		let gameHeight = 1080;

		if (gameInfo) {
			gameWidth = gameInfo.width;
			gameHeight = gameInfo.height;
			console.log(`Using game dimensions from service: ${gameWidth}x${gameHeight}`);
		} else {
			console.log(`No game info available, using defaults: ${gameWidth}x${gameHeight}`);
		}

		console.log(`Final overlay dimensions: ${gameWidth}x${gameHeight}`);

		const preloadPath = join(__dirname, 'main.preload.js');
		console.log('Preload script path:', preloadPath);
		console.log('Current __dirname:', __dirname);

		// Shared-texture path (overlay ≥2.0.2). Opt-in via FS_USE_SHARED_TEXTURE=1 —
		// on 2.0.5 it logs OSRSharedTextureNotReleased and the fullscreen overlay then
		// eats all mouse input (game appears stuck). Do NOT pass the flag on older
		// packages either (1.13.x accepts the unknown option but breaks load).
		const gameWindowInfo = this.overlayApi.getActiveGameInfo?.()?.gameWindowInfo;
		const sharedTextureSupported = gameWindowInfo?.isSharedTextureSupported;
		const sharedTextureAvailable = gameWindowInfo?.isSharedTextureAvailable;
		const sharedTextureOptIn = process.env.FS_USE_SHARED_TEXTURE === '1';
		const canRequestSharedTexture =
			sharedTextureOptIn && this.isOverlayPackageAtLeast('2.0.2') && sharedTextureAvailable !== false;
		console.log('[Overlay] Shared-texture probe:', {
			overlayPackageVersion: this.overlayPackageVersion,
			graphics: gameWindowInfo?.graphics,
			isSharedTextureSupported: sharedTextureSupported,
			isSharedTextureAvailable: sharedTextureAvailable,
			sharedTextureOptIn,
			canRequestSharedTexture,
		});
		if (sharedTextureOptIn && this.overlayPackageVersion && !this.isOverlayPackageAtLeast('2.0.2')) {
			console.warn(
				`[Overlay] Overlay package ${this.overlayPackageVersion} is older than 2.0.2 — not passing useSharedTexture`,
			);
		}

		// Leave passthrough unset → Overwolf default `noPassThrough` (CPU path alpha
		// hit-test: empty pixels → game, widgets stay clickable).
		// Shared-texture path has no alpha hit-test (full window rect captures input).
		// Overwolf workaround: passThroughAndNotify + flip to noPassThrough while the
		// pointer is over interactive widgets — see
		// https://dev.overwolf.com/ow-electron/reference/examples/overlay/shared-texture-rendering/#beta-limitation-hit-testing-ignores-transparent-pixels
		// Override: FS_OVERLAY_PASSTHROUGH=noPassThrough|passThrough|passThroughAndNotify
		const passthroughEnv = process.env.FS_OVERLAY_PASSTHROUGH?.trim();
		let passthrough: 'noPassThrough' | 'passThrough' | 'passThroughAndNotify' | undefined =
			passthroughEnv === 'passThrough' ||
			passthroughEnv === 'passThroughAndNotify' ||
			passthroughEnv === 'noPassThrough'
				? passthroughEnv
				: undefined;

		this.sharedTextureHitTestWorkaround = false;
		if (canRequestSharedTexture) {
			// Documented default for shared-texture fullscreen HUDs unless overridden.
			if (!passthrough) {
				passthrough = 'passThroughAndNotify';
			}
			this.sharedTextureHitTestWorkaround = passthrough === 'passThroughAndNotify';
		}

		const options: OverlayWindowOptions & { dpiAware?: boolean } = {
			name: 'firestone-overlay-' + Math.floor(Math.random() * 1000),
			height: gameHeight,
			width: gameWidth,
			// Never show until DOM ready — avoids a blank fullscreen input sink
			// while Angular is still loading (especially painful on 2.0.x).
			show: false,
			transparent: true,
			resizable: false,
			dpiAware: false,
			// Do NOT use zOrder: 'bottomMost' — on overlay 2.0.x that can composite
			// the HUD under the game (invisible). Loading window uses topMost instead.
			webPreferences: {
				devTools: true,
				nodeIntegration: true,
				contextIsolation: false,
				preload: preloadPath,
				// Prevent Chromium from starving the fullscreen overlay while the
				// loading window / DevTools take focus (multi-minute DOM-ready in dev).
				backgroundThrottling: false,
			},
			// Position at top-left to cover entire game window
			x: 0,
			y: 0,
		};
		if (passthrough) {
			options.passthrough = passthrough;
		}
		if (canRequestSharedTexture) {
			options.useSharedTexture = true;
		}

		console.log('[Overlay] Creating window with useSharedTexture=', options.useSharedTexture ?? false, {
			passthrough: options.passthrough ?? 'noPassThrough(default)',
			sharedTextureHitTestWorkaround: this.sharedTextureHitTestWorkaround,
			backgroundThrottling: options.webPreferences?.backgroundThrottling,
		});
		console.debug('Overlay window options:', formatLogArg(options));

		this.overlayWindow = await this.overlayApi.createWindow(options);

		this.overlayWindow.window.once('closed', () => {
			this.overlayWindow = null;
		});

		try {
			// Packaged / FS_ELECTRON_FRONTEND_DIR → file://; else webpack-dev (hash route required).
			const frontendUrl = getElectronFrontendUrl('overlay');
			console.log('Loading Angular overlay:', frontendUrl);

			let overlayShown = false;
			const loadStartedAt = Date.now();
			const logLoadMilestone = (label: string, extra?: Record<string, unknown>) => {
				console.log(`[Overlay] load ${label} +${Date.now() - loadStartedAt}ms`, extra ?? '');
			};
			const showOverlayWhenReady = (reason: string) => {
				if (overlayShown) {
					return;
				}
				if (!this.overlayWindow?.window || this.overlayWindow.window.isDestroyed()) {
					return;
				}
				overlayShown = true;
				logLoadMilestone(`show (${reason})`);
				console.log('Angular DOM ready, showing overlay...');
				// show() only — do not focus()/alwaysOnTop; that steals input from HS and
				// with useSharedTexture the fullscreen overlay then eats every click.
				this.overlayWindow.window.show();
				console.log('Overlay window shown after Angular DOM ready');

				// Defer DevTools so they don't compete with first paint / JS compile.
				// Opt out with FS_OVERLAY_DEVTOOLS=0.
				if (
					App.isDevelopmentMode() &&
					process.env.FS_OVERLAY_DEVTOOLS !== '0' &&
					!this.overlayWindow.window.webContents.isDevToolsOpened()
				) {
					setTimeout(() => {
						if (!this.overlayWindow?.window || this.overlayWindow.window.isDestroyed()) {
							return;
						}
						if (this.overlayWindow.window.webContents.isDevToolsOpened()) {
							return;
						}
						console.log('🔧 Opening overlay dev tools (deferred)');
						this.overlayWindow.window.webContents.openDevTools({
							mode: 'detach',
							activate: false,
						});
					}, 2000);
				}
			};

			// Register BEFORE loadURL — otherwise a fast/already-ready DOM misses the listener
			// and we never call show()/focus (symptoms: overlay "not loading" in-game).
			const wc = this.overlayWindow.window.webContents;
			wc.setBackgroundThrottling?.(false);
			wc.once('did-start-loading', () => logLoadMilestone('did-start-loading'));
			wc.once('dom-ready', () => {
				logLoadMilestone('dom-ready');
				showOverlayWhenReady('dom-ready');
			});
			wc.once('did-finish-load', () => {
				logLoadMilestone('did-finish-load', { url: wc.getURL() });
				// Fallback if dom-ready already fired before the listener was attached.
				showOverlayWhenReady('did-finish-load');
			});
			wc.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
				if (!isMainFrame) {
					return;
				}
				logLoadMilestone('did-fail-load', { errorCode, errorDescription, validatedURL });
				console.error('Overlay main frame failed to load:', {
					errorCode,
					errorDescription,
					validatedURL,
				});
			});

			if (App.isDevelopmentMode()) {
				console.log('🔧 Setting up deferred dev tools for overlay window (dev mode)');
			}

			logLoadMilestone('loadURL begin', { frontendUrl });
			await this.overlayWindow.window.loadURL(frontendUrl);
			logLoadMilestone('loadURL resolved');

			// Add keyboard shortcut to manually open dev tools
			this.overlayWindow.window.webContents.on('before-input-event', (event, input) => {
				if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
					this.overlayWindow.window.webContents.toggleDevTools();
					console.log('Dev tools toggled manually');
				}
			});

			// Show a notification for premium users only (free users get the loading+ad window)
			const ads = AppInjector.get(StandaloneAdService);
			const shouldShowAds = await ads.shouldDisplayAds();
			if (!shouldShowAds) {
				const notificationsService = AppInjector.get(NotificationsService);
				const localizationService = AppInjector.get(ILocalizationService);
				const title = localizationService.translateString('app.internal.startup.firestone-ready-title');
				const text = localizationService.translateString('app.internal.startup.firestone-ready-text');
				notificationsService.emitNewNotification({
					content: `
					<div class="general-message-container general-theme">
						<div class="firestone-icon">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#ad_placeholder" />
							</svg>
						</div>
						<div class="message">
							<div class="title">
								<span>${title}</span>
							</div>
							<span class="text">${text}</span>
						</div>
						<button class="i-30 close-button">
							<svg class="svg-icon-fill">
								<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#window-control_close"></use>
							</svg>
						</button>
					</div>`,
					notificationId: `app-ready`,
				});
			}

			console.log('Angular overlay window created successfully! Waiting for show/focus...');
		} catch (error) {
			console.error('Error loading Angular overlay:', error);
			console.error(
				'Frontend load failed. For unpackaged runs use nxe:serve:frontend, or set FS_ELECTRON_FRONTEND_DIR to a production build.',
			);
			// Don't create fallback window - just fail gracefully
			throw error;
		}
	}

	/**
	 * Wait for overlay package to be ready.
	 * `restart:ow-electron` sets both `--owepm-packages-channel=DEV` and
	 * `FS_OVERLAY_CHANNEL=dev`. The CLI feed flag alone does not select overlay
	 * 2.0.5 — `packages.setChannel('overlay', 'dev')` does.
	 *
	 * Channel switches must finish *before* we start the overlay / inject: a
	 * mid-session `packages.relaunch()` left injection loading the old
	 * 1.13.22 plugin path after 2.0.5 was installed (missing .node → no overlay).
	 */
	private startOverlayWhenPackageReady(): void {
		void this.initOverlayPackagePipeline();
	}

	private async initOverlayPackagePipeline(): Promise<void> {
		let channelSettled = !process.env.FS_OVERLAY_CHANNEL?.trim();
		let pendingOverlayVersion: string | null = null;

		app.overwolf.packages.on('ready', (e, packageName, version) => {
			console.log('Overlay package ready:', packageName, version);
			if (packageName !== 'overlay') {
				return;
			}
			if (!channelSettled) {
				// Hold until setChannel finishes — starting on the old package breaks inject.
				pendingOverlayVersion = version;
				console.log(`[Overlay] Deferring overlay init for ${version} until FS_OVERLAY_CHANNEL settle`);
				return;
			}
			this.onOverlayPackageReady(version);
		});

		const switchOutcome = await this.maybeSwitchOverlayChannel();
		if (switchOutcome === 'relaunching') {
			// Full process relaunch in flight — drop any deferred old-package ready.
			return;
		}

		channelSettled = true;
		if (pendingOverlayVersion) {
			this.onOverlayPackageReady(pendingOverlayVersion);
		}
	}

	private onOverlayPackageReady(version: string): void {
		if (this.isOverlayReady) {
			// packages.relaunch / duplicate ready — re-bind to the new version
			console.log(`[Overlay] Overlay package ready again (${version}) — re-initializing`);
		}
		this.isOverlayReady = true;
		this.startOverlay(version);
	}

	/**
	 * @returns `relaunching` when a channel download will restart the app;
	 *          `ok` when we can proceed with the current package.
	 */
	private async maybeSwitchOverlayChannel(): Promise<'ok' | 'relaunching'> {
		const raw = process.env.FS_OVERLAY_CHANNEL?.trim();
		if (!raw) {
			console.log('[Overlay] FS_OVERLAY_CHANNEL unset — keeping persisted overlay channel');
			return 'ok';
		}
		// packages.setChannel uses lowercase ids (dev / public).
		const channel = raw.toLowerCase();
		try {
			const current = await app.overwolf.packages.getChannel('overlay');
			const available = await app.overwolf.packages.getAvailableChannels('overlay');
			console.log('[Overlay] Channel switch requested:', {
				requested: channel,
				current: current?.overlay,
				available: available?.overlay,
			});
			if (current?.overlay === channel) {
				console.log(`[Overlay] Already on channel "${channel}"`);
				return 'ok';
			}
			const result = await app.overwolf.packages.setChannel('overlay', channel, (pkg) => {
				console.log(
					`[Overlay] Channel "${channel}" downloaded: ${pkg.name}@${pkg.version} — relaunching app for clean native plugin load`,
				);
				// Full app relaunch: packages.relaunch() alone can leave inject()
				// resolving the previous overlay version's .node path (broken HUD).
				electronApp.relaunch();
				electronApp.exit(0);
			});
			if (!result.success) {
				console.error('[Overlay] setChannel failed:', result.error);
				return 'ok';
			}
			console.log(
				`[Overlay] setChannel("${channel}") accepted — waiting for download/relaunch before overlay init`,
			);
			return 'relaunching';
		} catch (error) {
			console.error('[Overlay] Failed to switch overlay channel:', error);
			return 'ok';
		}
	}

	/**
	 * Initialize overlay after package is ready
	 */
	private startOverlay(version: string): void {
		if (!this.overlayApi) {
			throw new Error('Attempting to access overlay before available');
		}

		this.overlayPackageVersion = version;
		console.log(`Overlay package is ready: ${version}`);
		const requested = process.env.FS_OVERLAY_CHANNEL?.trim().toLowerCase();
		if (requested === 'dev' && !this.isOverlayPackageAtLeast('2.0.2')) {
			console.warn(
				`[Overlay] Expected overlay ≥2.0.2 on channel "dev" but got ${version}. ` +
					`Shared-texture / hit-test workaround will not activate. Skipping overlay init until channel catches up.`,
			);
			this.isOverlayReady = false;
			return;
		}
		if (requested === 'public' && this.isOverlayPackageAtLeast('2.0.0')) {
			console.warn(`[Overlay] Expected overlay 1.13.x on channel "public" but got ${version}.`);
		}
		this.registerOverlayEvents();
		this.subscribeToGameInfoChanges();
		this.subscribeToGameExit();
		this.setupAppAccessSubscription();
		this.emit('ready');
	}

	/** Loose semver compare for ow-electron package versions (major.minor.patch[+prerelease]). */
	private isOverlayPackageAtLeast(minimum: string): boolean {
		const parse = (v: string) =>
			v
				.split('-')[0]
				.split('.')
				.map((n) => Number.parseInt(n, 10) || 0);
		const [aMaj, aMin, aPat] = parse(this.overlayPackageVersion ?? '0');
		const [bMaj, bMin, bPat] = parse(minimum);
		if (aMaj !== bMaj) {
			return aMaj > bMaj;
		}
		if (aMin !== bMin) {
			return aMin > bMin;
		}
		return aPat >= bPat;
	}

	/**
	 * Tear down the main overlay on HS exit so the next inject creates a fresh window.
	 * Without this, shouldCreateOverlay() keeps a zombie ref and skips recreate.
	 */
	private subscribeToGameExit(): void {
		this.gameWindowService.onGameExit(() => {
			console.log('[Overlay] Hearthstone exited — destroying overlay window');
			void this.destroyOverlay();
		});
	}

	private setupAppAccessSubscription(): void {
		this.appAccessSubscription?.unsubscribe();
		this.appAccessSubscription = appAccessUnlocked$$.subscribe((unlocked) => {
			if (!unlocked) {
				void this.destroyOverlay();
			} else {
				void this.tryCreateOverlayAfterUnlock();
			}
		});
	}

	/**
	 * If the user was locked when HS started, we still injected; game-injected skipped window creation.
	 * When access unlocks, create the overlay if a game is already running and we have no window yet.
	 */
	private async tryCreateOverlayAfterUnlock(): Promise<void> {
		if (!isAppAccessUnlocked() || !this.shouldCreateOverlay()) {
			return;
		}
		const gameInfo = this.gameWindowService.getCurrentGameInfo();
		if (!gameInfo) {
			console.log(
				'[Overlay] App unlocked but no cached game window info yet — overlay will be created on Hearthstone focus or next injection flow',
			);
			return;
		}
		console.log('[Overlay] App unlocked with game already running — creating overlay window');
		await this.createOverlayWindow();
	}

	/**
	 * Subscribe to game info changes from the centralized service
	 * This ensures the overlay is resized AFTER the game info has been updated
	 */
	private subscribeToGameInfoChanges(): void {
		this.gameWindowService.onGameInfoChanged((gameInfo) => {
			if (gameInfo && this.overlayWindow) {
				// console.log(`Game info changed, resizing overlay to: ${gameInfo.width}x${gameInfo.height}`);
				this.resizeOverlayToGame();
			}
		});
		console.log('Subscribed to game info changes for overlay resizing');
	}

	/**
	 * Register event handlers for overlay events
	 */
	private registerOverlayEvents(): void {
		// Prevent double events in case the package relaunches due to crash or update
		this.overlayApi.removeAllListeners();

		console.log('Registering to overlay package events');

		this.overlayApi.on('game-launched', async (event, gameInfo) => {
			console.log('Game launched:', gameInfo.name);
			console.log('Game ID:', gameInfo.id, '(looking for 9898 for Hearthstone)');
			// console.log('Process info:', JSON.stringify(gameInfo.processInfo, null, 2));
			// console.log('Window info:', JSON.stringify(gameInfo, null, 2));

			// Check if this is Hearthstone (ID 9898)
			if (Math.round(gameInfo.id / 10) === 9898) {
				// Check for elevation issues
				if (gameInfo.processInfo.isElevated) {
					console.error('Cannot inject to elevated game - app is not elevated');
					const notificationsService = AppInjector.get(NotificationsService);
					notificationsService.notifyError(
						'Could not inject',
						'The game is running as administrator, so you need to run Firestone as an administrator to enable game injection.',
						'game-injection-error',
					);
					return;
				}

				// Always inject when HS launches (ow-electron needs this for in-game compositing), even
				// if the full app is still locked. We only skip creating the overlay window until unlock.
				if (!isAppAccessUnlocked()) {
					console.log(
						'[Overlay] Hearthstone launched while full app locked — still calling inject; overlay window will be created when unlocked (or on focus)',
					);
				} else {
					console.log('Hearthstone detected! Injecting first...');
				}

				// Try injecting FIRST, then create window in the injected event
				console.log('Calling event.inject() BEFORE creating window...');
				try {
					event.inject();
					console.log('event.inject() called successfully');
				} catch (error) {
					console.error('Error calling event.inject():', error);
				}
			} else {
				console.log(`Game ${gameInfo.name} (ID: ${gameInfo.id}) launched, but not Hearthstone`);
			}
		});

		this.overlayApi.on('game-injection-error', (gameInfo, error) => {
			console.error('Game injection error:', error, gameInfo);
		});

		this.overlayApi.on('game-injected', async (gameInfo) => {
			console.log('Game injected successfully!', gameInfo.name);
			if (!isAppAccessUnlocked()) {
				console.log('[Overlay] Skipping overlay after injection — full app not unlocked');
				return;
			}
			// shouldCreateOverlay destroys zombies (disposed render frame) before returning true
			if (!this.shouldCreateOverlay()) {
				console.log('[Overlay] Healthy overlay already exists after inject — keeping it');
				return;
			}
			console.log('Hearthstone injected! Creating overlay window...');
			await this.createOverlayWindow();
			console.log('Overlay window created when game was injected!');
		});

		this.overlayApi.on('game-focus-changed', async (window, game, focus) => {
			if (game.classId === 9898 && focus) {
				if (!isAppAccessUnlocked()) {
					return;
				}
				// Resizing is handled by subscribeToGameInfoChanges() callback
				if (!this.shouldCreateOverlay()) {
					return;
				}
				console.log('Hearthstone focused! Creating overlay window...');
				await this.createOverlayWindow();
				console.log('Overlay window created when game got focus!');
			}
		});

		this.overlayApi.on('game-window-changed', async (window, game, reason) => {
			// console.log('Game window changed:', reason, game.name);
			// Note: Resizing is now handled by onGameInfoChanged callback in subscribeToGameInfoChanges()
			// This ensures the overlay is resized AFTER ElectronGameWindowService has updated its cached info
		});

		this.overlayApi.on('game-input-interception-changed', (info) => {
			console.log('Input interception changed:', info);
		});

		this.overlayApi.on('game-input-exclusive-mode-changed', (info) => {
			console.log('Input exclusive mode changed:', info);
		});

		// Overlay package ≥2.1.0: fires when shared-texture path can't be used (falls back to CPU copy).
		this.overlayApi.on('shared-texture-unavailable', (reason) => {
			console.warn('[Overlay] shared-texture-unavailable:', reason, {
				hint:
					reason === 'gpuAdapterMismatch'
						? 'Try overlay.setGpuPreference("highPerformance") + app restart'
						: undefined,
			});
		});
	}

	/**
	 * Update the decktracker widget with new deck data
	 */
	public updateDeckData(deckData: any) {
		if (this.overlayWindow && this.overlayWindow.window) {
			try {
				// Execute JavaScript in the overlay window to update the deck data
				const deckDataJson = JSON.stringify(deckData).replace(/'/g, "\\'");
				this.overlayWindow.window.webContents.executeJavaScript(`
					if (window.updateDeckData) {
						window.updateDeckData(${deckDataJson});
					}
				`);
			} catch (error) {
				console.error('❌ Error updating deck data:', error);
			}
		}
	}

	/**
	 * Send an IPC message to the overlay window
	 */
	public sendToOverlay(channel: string, ...args: any[]): void {
		if (this.overlayWindow && this.overlayWindow.window) {
			try {
				this.overlayWindow.window.webContents.send(channel, ...args);
			} catch (error) {
				console.error(`[OverlayService] Error sending IPC message to overlay (${channel}):`, error);
			}
		}
	}
}
