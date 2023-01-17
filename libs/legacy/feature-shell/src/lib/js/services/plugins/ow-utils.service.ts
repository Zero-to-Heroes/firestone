import { Injectable } from '@angular/core';
import { OverwolfService } from '../overwolf.service';

declare let OverwolfPlugin: any;

@Injectable()
export class OwUtilsService {
	private plugin: any;
	initialized = false;

	constructor() {
		console.log('[ow-utils] init starting');
		this.initialize();
		window['flashWindow'] = () => this.flashWindow();
		console.log('[ow-utils] init done');
	}

	public async flashWindow(windowName = 'Hearthstone'): Promise<void> {
		return new Promise<void>(async (resolve, reject) => {
			// console.log('[ow-utils] flashing window', windowName);
			const plugin = await this.get();
			try {
				plugin.flashWindow(windowName, () => {
					// console.log('[ow-utils] flashed window');
					resolve();
				});
			} catch (e) {
				console.log('[ow-utils] could not flash window', e);
				resolve();
			}
		});
	}

	public async captureWindow(windowName: string, copyToClipboard = false): Promise<[string, any]> {
		return new Promise<[string, any]>(async (resolve, reject) => {
			console.log('[ow-utils] capturing window', windowName);
			const plugin = await this.get();
			try {
				const path = `${OverwolfService.getLocalAppDataFolder()}/Temp`;
				plugin.captureWindow(windowName, path, copyToClipboard, (screenshotLocation, byteArray) => {
					console.log('[ow-utils] took screenshot', screenshotLocation, byteArray?.length);
					resolve([screenshotLocation, byteArray]);
				});
			} catch (e) {
				console.log('[ow-utils] could not take screenshot', e);
				resolve(null);
			}
		});
	}

	public async captureActiveWindow(): Promise<[string, any]> {
		return new Promise<[string, any]>(async (resolve, reject) => {
			const plugin = await this.get();

			try {
				const path = `${OverwolfService.getLocalAppDataFolder()}/Temp`;
				plugin.captureActiveWindow(path, (screenshotLocation, byteArray) => {
					resolve([screenshotLocation, byteArray]);
				});
			} catch (e) {
				console.log('[ow-utils] could not take screenshot', e);
				resolve(null);
			}
		});
	}

	public async deleteFileOrFolder(path: string): Promise<void> {
		return new Promise<void>(async (resolve, reject) => {
			console.log('[ow-utils] deleting', path);
			const plugin = await this.get();
			try {
				plugin.deleteFileOrFolder(path, () => {
					console.log('[ow-utils] deleted', path);
					resolve();
				});
			} catch (e) {
				console.log('[ow-utils] could not delete file or folder', path, e);
				resolve();
			}
		});
	}

	public async copyFiles(sourceDirectory: string, destinationDirectory: string): Promise<void> {
		return new Promise<void>(async (resolve, reject) => {
			console.log('[ow-utils] copyFiles', sourceDirectory, destinationDirectory);
			const plugin = await this.get();
			try {
				plugin.copyFiles(sourceDirectory, destinationDirectory, () => {
					console.log('[ow-utils] copyFilesed', sourceDirectory, destinationDirectory);
					resolve();
				});
			} catch (e) {
				console.log('[ow-utils] could not copyFiles', sourceDirectory, destinationDirectory, e);
				resolve();
			}
		});
	}

	public async downloadAndUnzipFile(fileUrl: string, path: string): Promise<void> {
		return new Promise<void>(async (resolve, reject) => {
			console.log('[ow-utils] downloadAndUnzipFile-ing', path);
			const plugin = await this.get();
			try {
				plugin.downloadAndUnzipFile(fileUrl, path, (status, message) => {
					if (status) {
						console.log('[ow-utils] downloadAndUnzipFiled', path);
						resolve();
					} else {
						console.log('[ow-utils] downloadAndUnzipFile message', message);
					}
				});
			} catch (e) {
				console.log('[ow-utils] could not downloadAndUnzipFile', fileUrl, path, e);
				resolve();
			}
		});
	}

	public async downloadFileTo(fileUrl: string, path: string, targetFileName): Promise<void> {
		return new Promise<void>(async (resolve, reject) => {
			console.log('[ow-utils] downloadFileTo-ing', path);
			const plugin = await this.get();
			try {
				plugin.downloadFileTo(fileUrl, path, targetFileName, (status, message) => {
					if (status) {
						console.log('[ow-utils] downloadFileTod', path);
						resolve();
					} else {
						console.log('[ow-utils] downloadFileTo message', message);
					}
				});
			} catch (e) {
				console.log('[ow-utils] could not downloadFileTo', fileUrl, path, e);
				resolve();
			}
		});
	}

	public async get() {
		await this.waitForInit();
		return this.plugin.get();
	}

	private initialize() {
		this.initialized = false;
		try {
			console.log('[ow-utils] plugin init starting', this.plugin);
			this.plugin = new OverwolfPlugin('ow-utils', true);
			this.plugin.initialize(async (status: boolean) => {
				if (status === false) {
					console.error("[ow-utils] Plugin couldn't be loaded??", 'retrying');
					setTimeout(() => this.initialize(), 2000);
					return;
				}
				console.log('[ow-utils] Plugin ' + this.plugin.get()._PluginName_ + ' was loaded!');
				// this.plugin.get().onGlobalEvent.addListener((first: string, second: string) => {
				// 	console.log('[ow-utils] received global event', first, second);
				// });
				this.initialized = true;
			});
		} catch (e) {
			console.warn('[ow-utils]Could not load plugin, retrying', e);
			setTimeout(() => this.initialize(), 2000);
		}
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				if (this.initialized) {
					resolve();
				} else {
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}
}
