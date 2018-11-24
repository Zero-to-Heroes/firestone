import { Injectable } from '@angular/core';

declare var OverwolfPlugin: any;

@Injectable()
export class SimpleIOService {

	simpleIOPlugin: any;
	initialized: boolean = false;

	constructor() {
		this.initialized = false;
		console.log("loading simple-io-plugin-zip");
		this.simpleIOPlugin = new OverwolfPlugin("simple-io-plugin-zip", true);
		this.simpleIOPlugin.initialize((status: boolean) => {
			if (status === false) {
				console.warn("Plugin simple-io-plugin-zip couldn't be loaded");
				return;
			}
			console.log("Plugin " + this.simpleIOPlugin.get()._PluginName_ + " was loaded!");
			this.simpleIOPlugin.get().onGlobalEvent.addListener(function(first, second) {
				console.log('received global event simple-io-plugin-zip', first, second);
			});
			this.initialized = true;
		});
	}

	public get() {
		return this.simpleIOPlugin.get();
	}

	public fileExists(filePath: string): Promise<boolean> {
		// await this.waitForInit();
		return new Promise<boolean>((resolve) => {
			this.get().fileExists(filePath, (result, message) => {
				console.log('file exists?', filePath, result, message);
				resolve(result);
			});
		});
	}

	public deleteFile(filePath: string): Promise<boolean> {
		// await this.waitForInit();
		return new Promise<boolean>((resolve) => {
			this.get().deleteFile(filePath, (result, message) => {
				console.log('deletion completed', filePath, result, message);
				resolve(result);
			});
		});
	}

	// private waitForInit(): Promise<void> {
	// 	return new Promise<void>((resolve) => {
	// 		const waitInit = () => {
	// 			// console.log('Promise waiting for io-plugin');
	// 			if (this.initialized) {
	// 				// console.log('wait for io-plugin init complete');
	// 				resolve();
	// 			} 
	// 			else {
	// 				// console.log('waiting for db init');
	// 				setTimeout(() => waitInit(), 50);
	// 			}
	// 		}
	// 		waitInit();
	// 	});
	// }
}
