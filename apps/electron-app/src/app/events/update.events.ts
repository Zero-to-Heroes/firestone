import { dialog, MessageBoxOptions } from 'electron';
import { autoUpdater } from 'electron-updater';
import App from '../app';

export default class UpdateEvents {
	// initialize auto update service - must be invoked only in production
	static initAutoUpdateService() {
		if (!App.isDevelopmentMode()) {
			console.log('Initializing auto update service...\n');

			// Configure auto updater
			autoUpdater.autoDownload = true;
			autoUpdater.autoInstallOnAppQuit = true;

			// Set up event listeners
			UpdateEvents.setupEventListeners();

			// Check for updates on startup
			UpdateEvents.checkForUpdates();

			// Check for updates periodically (every 4 hours)
			setInterval(() => {
				UpdateEvents.checkForUpdates();
			}, 4 * 60 * 60 * 1000);
		}
	}

	// check for updates - must be invoked after initAutoUpdateService() and only in production
	static checkForUpdates() {
		if (!App.isDevelopmentMode()) {
			console.log('Checking for updates...\n');
			autoUpdater.checkForUpdates().catch((err) => {
				console.error('Error checking for updates:', err);
			});
		}
	}

	private static setupEventListeners() {
		autoUpdater.on('checking-for-update', () => {
			console.log('Checking for updates...\n');
		});

		autoUpdater.on('update-available', (info) => {
			console.log('New update available! Version:', info.version);
		});

		autoUpdater.on('update-not-available', (info) => {
			console.log('Up to date! Current version:', info.version);
		});

		autoUpdater.on('error', (err) => {
			console.error('There was a problem updating the application');
			console.error(err);
		});

		autoUpdater.on('download-progress', (progressObj) => {
			const message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
			console.log(message);
		});

		autoUpdater.on('update-downloaded', (info) => {
			const dialogOpts: MessageBoxOptions = {
				type: 'info' as const,
				buttons: ['Restart', 'Later'],
				title: 'Application Update',
				message: `A new version (${info.version}) has been downloaded.`,
				detail: 'Restart the application to apply the updates.',
			};

			dialog.showMessageBox(dialogOpts).then((returnValue) => {
				if (returnValue.response === 0) {
					autoUpdater.quitAndInstall(false, true);
				}
			});
		});
	}
}
