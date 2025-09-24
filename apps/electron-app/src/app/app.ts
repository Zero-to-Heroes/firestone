// Import Angular compiler FIRST to enable JIT compilation fallback for decorated services
import '@angular/compiler';
import { ElectronGameWindowService } from '@firestone/electron/common';
// import '@overwolf/types';
import { BrowserWindow } from 'electron';
import { environment } from '../environments/environment';
import { OverlayService } from './services/overlay.service';

export default class App {
	// Keep a global reference of the window object, if you don't, the window will
	// be closed automatically when the JavaScript object is garbage collected.
	static mainWindow: Electron.BrowserWindow;
	static application: Electron.App;
	static BrowserWindow;
	static overlay: OverlayService;
	static gameWindow: ElectronGameWindowService;

	static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
		App.BrowserWindow = browserWindow;
		App.application = app;

		// app.disableHardwareAcceleration(); // Keep hardware acceleration ENABLED for smooth drag performance

		App.application.on('window-all-closed', App.onWindowAllClosed); // Quit when all windows are closed.
		App.application.on('ready', App.onReady); // App is ready to load data
		App.application.on('activate', App.onActivate); // App is activated
	}

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

	private static async onReady() {
		// This method will be called when Electron has finished
		// initialization and is ready to create browser windows.
		// Some APIs can only be used after this event occurs.

		// Skip main window creation for overlay-only mode
		console.log('🚫 Skipping main window creation (overlay-only mode)');

		// Initialize game services
		App.gameWindow = ElectronGameWindowService.getInstance();
		App.overlay = OverlayService.getInstance();
		App.gameWindow.initialize(App.overlay);

		// Wait for overlay to be ready before registering to games
		App.overlay.on('ready', async () => {
			console.log('🎯 Overlay service is ready!');

			// Register to monitor Hearthstone
			await App.overlay.registerToHearthstone();

			// Don't create overlay window yet - wait for game launch event
			console.log('⏳ Waiting for Hearthstone to launch...');
		});
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
}
