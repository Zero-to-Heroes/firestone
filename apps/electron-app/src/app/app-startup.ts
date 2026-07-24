import { MainWindowStoreService } from '@firestone/mainwindow/common';
import { GameStatusService, StandaloneAdService } from '@firestone/shared/common/service';
import { AppInjector, WINDOW_HANDLER_SERVICE_TOKEN } from '@firestone/shared/framework/core';
import { ipcMain } from 'electron';
import { ElectronHotkeyHandlerService } from './services/electron-hotkey-handler.service';
import { ElectronWindowHandlerService } from './services/electron-window-handler.service';
import { GameDetectionService } from './services/game-detection.service';
import { OverlayService } from './services/overlay.service';

const LOADING_SCREEN_DURATION = 10000;

/** True once the overlay loading window has actually been opened this session. */
let loadingWindowShown = false;
/** True when we want the loading window but are waiting for overlay injection. */
let loadingWindowPending = false;
let readyTimeout: ReturnType<typeof setTimeout> | null = null;

export const appStartup = async () => {
	console.log('appStartup');
	const mainWindowStore = AppInjector.get(MainWindowStoreService);
	await mainWindowStore.init();

	const gameStatus = AppInjector.get(GameStatusService);
	await gameStatus.isReady();

	ipcMain.removeHandler('loading-window-get-ready-state');
	ipcMain.handle('loading-window-get-ready-state', () => {
		return getWindowHandler().isLoadingAbilitiesReady();
	});

	gameStatus.onGameStart(() => {
		void requestLoadingScreen('game-status');
	});
	gameStatus.onGameExit(() => {
		loadingWindowShown = false;
		loadingWindowPending = false;
		clearReadyTimeout();
		const windowHandler = getWindowHandler();
		windowHandler.resetLoadingAbilitiesReady();
		windowHandler.closeLoadingWindow();
	});

	// If HS is already running, queue the loading window — it will open once overlay injects.
	const hsProcessRunning = await GameDetectionService.isHearthstoneProcessRunning();
	console.log('[startup] Hearthstone process running?', hsProcessRunning);
	if (hsProcessRunning) {
		void requestLoadingScreen('process-check');
	}

	const overlay = OverlayService.getInstance();
	const onOverlayReadyForLoading = () => {
		const overlayApi = overlay.overlayApi;
		if (!overlayApi) {
			return;
		}
		overlayApi.on('game-injected', (gameInfo: any) => {
			if (Math.round((gameInfo?.id ?? 0) / 10) !== 9898) {
				return;
			}
			void requestLoadingScreen('game-injected');
			void tryShowPendingLoadingWindow('game-injected');
		});
		// Overlay just became ready; if we already queued a show (process-check), try now.
		void tryShowPendingLoadingWindow('overlay-ready');
	};
	if (overlay.overlayApi) {
		onOverlayReadyForLoading();
	} else {
		overlay.on('ready', onOverlayReadyForLoading);
	}
};

/**
 * Decide whether the loading+ad window should appear, and either show it as an overlay
 * immediately or mark it pending until injection is available.
 */
async function requestLoadingScreen(reason: string): Promise<void> {
	if (loadingWindowShown) {
		console.log('[startup] loading screen already shown, skipping', reason);
		return;
	}

	const windowHandler = getWindowHandler();
	const hotkeyHandler = AppInjector.get(ElectronHotkeyHandlerService);
	const ads = AppInjector.get(StandaloneAdService);

	const shouldShowAds = await ads.shouldDisplayAds();
	const collectionVisible = windowHandler.isCollectionWindowVisible();
	console.log('[startup] request loading screen?', { reason, shouldShowAds, collectionVisible });

	if (!shouldShowAds || collectionVisible) {
		loadingWindowPending = false;
		hotkeyHandler.isCollectionHotkeyActive = true;
		return;
	}

	hotkeyHandler.isCollectionHotkeyActive = false;
	loadingWindowPending = true;
	await tryShowPendingLoadingWindow(reason);
}

async function tryShowPendingLoadingWindow(reason: string): Promise<void> {
	if (loadingWindowShown || !loadingWindowPending) {
		return;
	}

	const windowHandler = getWindowHandler();
	const opened = await windowHandler.showLoadingWindow();
	if (!opened) {
		console.log('[startup] loading overlay not ready yet, waiting', reason);
		return;
	}

	loadingWindowShown = true;
	loadingWindowPending = false;
	console.log('[startup] loading overlay shown', reason);
	clearReadyTimeout();
	readyTimeout = setTimeout(() => {
		notifyAbilitiesReady();
	}, LOADING_SCREEN_DURATION);
}

function notifyAbilitiesReady(): void {
	const windowHandler = getWindowHandler();
	const hotkeyHandler = AppInjector.get(ElectronHotkeyHandlerService);
	hotkeyHandler.isCollectionHotkeyActive = true;
	windowHandler.notifyLoadingWindowReady();
	console.log('[startup] loading window ready');
}

function clearReadyTimeout(): void {
	if (readyTimeout) {
		clearTimeout(readyTimeout);
		readyTimeout = null;
	}
}

function getWindowHandler(): ElectronWindowHandlerService {
	return AppInjector.get(WINDOW_HANDLER_SERVICE_TOKEN) as ElectronWindowHandlerService;
}
