// Import Angular compiler FIRST to enable JIT compilation fallback for decorated services
import '@angular/compiler';
import { ElectronGameWindowService } from '@firestone/electron/common';
// import '@overwolf/types';
import { AllCardsService } from '@firestone-hs/reference-data';
import { GameEvents } from '@firestone/game-state';
import { CardsFacadeStandaloneService, setAppInjector } from '@firestone/shared/framework/core';
import { LogListenerService } from '@services/log-listener.service';
import { BrowserWindow, screen, shell } from 'electron';
import { join } from 'path';
import { format } from 'url';
import { environment } from '../environments/environment';
import { rendererAppName, rendererAppPort } from './constants';
import { electronAppInjector } from './services/electron-app-injector';
import { buildAppInjector } from './services/electron-app-injector-setup';
import { GameEventsElectronService } from './services/game-events-electron.service';
import { MindVisionElectronService } from './services/mind-vision-electron.service';
import { OverlayService } from './services/overlay.service';

export default class App {
	// Keep a global reference of the window object, if you don't, the window will
	// be closed automatically when the JavaScript object is garbage collected.
	static mainWindow: Electron.BrowserWindow;
	static application: Electron.App;
	static BrowserWindow;
	static overlay: OverlayService;
	static gameWindow: ElectronGameWindowService;

	public static isDevelopmentMode() {
		const isEnvironmentSet: boolean = 'ELECTRON_IS_DEV' in process.env;
		const getFromEnvironment: boolean = parseInt(process.env.ELECTRON_IS_DEV, 10) === 1;

		return isEnvironmentSet ? getFromEnvironment : !environment.production;
	}

	private static async onWindowAllClosed() {
		if (App.overlay) {
			await App.overlay.destroyOverlay();
		}

		if (process.platform !== 'darwin') {
			App.application.quit();
		}
	}

	private static onClose() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		App.mainWindow = null;
	}

	private static onRedirect(event: any, url: string) {
		if (url !== App.mainWindow.webContents.getURL()) {
			// this is a normal external redirect, open it in a new browser window
			event.preventDefault();
			shell.openExternal(url);
		}
	}

	private static onReady() {
		// This method will be called when Electron has finished
		// initialization and is ready to create browser windows.
		// Some APIs can only be used after this event occurs.

		// Skip main window creation for overlay-only mode
		console.log('🚫 Skipping main window creation (overlay-only mode)');
		// if (rendererAppName) {
		// 	App.initMainWindow();
		// 	App.loadMainWindow();
		// }

		// Initialize game detection
		App.initGameDetection();
	}

	private static async initGameDetection() {
		// Initialize dependency injection system
		const electronInjector = buildAppInjector();
		setAppInjector(electronInjector);

		// Initialize game services
		App.gameWindow = ElectronGameWindowService.getInstance();
		App.overlay = OverlayService.getInstance();
		App.gameWindow.initialize(App.overlay);

		console.log('🔧 Registered services:', electronAppInjector.getRegisteredServices());

		// Wait for overlay to be ready before registering to games
		App.overlay.on('ready', async () => {
			console.log('🎯 Overlay service is ready!');

			// Register to monitor Hearthstone
			await App.overlay.registerToHearthstone();

			// Don't create overlay window yet - wait for game launch event
			console.log('⏳ Waiting for Hearthstone to launch...');
		});

		// Initialize MindVision service for memory reading
		const mindVision = electronInjector.get(MindVisionElectronService);
		const allCards = electronInjector.get(CardsFacadeStandaloneService);
		const gameEventsPlugin = electronInjector.get(GameEventsElectronService);
		const gameEvents = electronInjector.get(GameEvents);
		const logListener = electronInjector.get(LogListenerService);
		gameEventsPlugin.init((gameEvent) => {
			console.log('[GameEventsElectron] [app] received event', gameEvent);
		});
		logListener
			.configure(
				'Power.log',
				(data) => gameEvents.receiveLogLine(data),
				(existingLine) => gameEvents.receiveExistingLogLine(existingLine),
			)
			.subscribe((status) => {
				console.log('[log-register] status for Power.log', status);
			})
			.start();
		// TODO: nx graph, and remove UI dependencies (probably some transitive stuff for game-state or battelgrounds-core?)
		console.log('[app] allCards', allCards);
		allCards.init(new AllCardsService(), 'enUS');
		const service = allCards.getService();
		console.log('[app] service', service);
		await service.initializeCardsDb(undefined, 'enUS');
		console.log('[app] allCards initialized', allCards.getCards()?.length ?? 'null');

		// Keep the old game detection for logging purposes
		// App.gameDetection.on('game-launched', (gameInfo) => {
		// 	console.log('🎮 Process detection - Game launched:', gameInfo.displayName);
		// });

		// App.gameDetection.on('game-closed', (gameInfo) => {
		// 	console.log('👋 Process detection - Game closed:', gameInfo.displayName);
		// });

		// // Start monitoring (both process detection and ow-electron overlay)
		// App.gameDetection.startMonitoring();
	}

	private static onActivate() {
		// On macOS it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		// Skip for overlay-only mode
		console.log('🚫 App activation - skipping main window recreation (overlay-only mode)');
		// if (App.mainWindow === null) {
		// 	App.onReady();
		// }
	}

	private static initMainWindow() {
		const workAreaSize = screen.getPrimaryDisplay().workAreaSize;
		const width = Math.min(1280, workAreaSize.width || 1280);
		const height = Math.min(720, workAreaSize.height || 720);

		// Create the browser window.
		App.mainWindow = new BrowserWindow({
			width: width,
			height: height,
			show: false,
			webPreferences: {
				contextIsolation: true,
				backgroundThrottling: false,
				preload: join(__dirname, 'main.preload.js'),
			},
		});
		App.mainWindow.setMenu(null);
		App.mainWindow.center();

		// if main window is ready to show, close the splash window and show the main window
		App.mainWindow.once('ready-to-show', () => {
			// Don't show main window for overlay-only mode
			// App.mainWindow.show();
			console.log('🚫 Main window ready but not showing (overlay-only mode)');
		});

		// Don't open dev tools for main window in overlay-only mode
		if (App.isDevelopmentMode()) {
			// App.mainWindow.webContents.openDevTools(); // Disabled for overlay-only mode

			// Enable main process debugging
			console.log('🔧 Main process debugging enabled. Check terminal for main process logs.');
			console.log('🔧 To debug main process with Chrome DevTools, run: npm run debug:main');
		}

		// Add keyboard shortcut for dev tools
		App.mainWindow.webContents.on('before-input-event', (event, input) => {
			if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
				App.mainWindow.webContents.toggleDevTools();
			}
		});

		// handle all external redirects in a new browser window
		// App.mainWindow.webContents.on('will-navigate', App.onRedirect);
		// App.mainWindow.webContents.on('new-window', (event, url, frameName, disposition, options) => {
		//     App.onRedirect(event, url);
		// });

		// Emitted when the window is closed.
		App.mainWindow.on('closed', () => {
			// Dereference the window object, usually you would store windows
			// in an array if your app supports multi windows, this is the time
			// when you should delete the corresponding element.
			App.mainWindow = null;
		});
	}

	private static loadMainWindow() {
		// load the index.html of the app.
		if (!App.application.isPackaged) {
			App.mainWindow.loadURL(`http://localhost:${rendererAppPort}`);
		} else {
			App.mainWindow.loadURL(
				format({
					pathname: join(__dirname, '..', rendererAppName, 'index.html'),
					protocol: 'file:',
					slashes: true,
				}),
			);
		}
	}

	static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
		// Deactivate debug logs for electron app
		console.debug = () => {};
		// we pass the Electron.App object and the
		// Electron.BrowserWindow into this function
		// so this class has no dependencies. This
		// makes the code easier to write tests for

		App.BrowserWindow = browserWindow;
		App.application = app;

		App.application.on('window-all-closed', App.onWindowAllClosed); // Quit when all windows are closed.
		App.application.on('ready', App.onReady); // App is ready to load data
		App.application.on('activate', App.onActivate); // App is activated
	}
}
