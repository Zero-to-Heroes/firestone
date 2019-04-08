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

	public async fileExists(filePath: string): Promise<boolean> {
		await this.waitForInit();
		const plugin = await this.get();
		return new Promise<boolean>((resolve) => {
			plugin.fileExists(filePath, (result, message) => {
				// console.log('file exists?', filePath, result, message);
				resolve(result);
			});
		});
	}

	public async deleteFile(filePath: string): Promise<boolean> {
		await this.waitForInit();
		const plugin = await this.get();
		return new Promise<boolean>((resolve) => {
			plugin.deleteFile(filePath, (result, message) => {
				console.log('deletion completed', filePath, result, message);
				resolve(result);
			});
		});
	}

	public async getFileContents(filePath: string): Promise<string> {
		await this.waitForInit();
		const plugin = await this.get();
		return new Promise<string>((resolve) => {
			plugin.getTextFile(filePath, false, (result, contents) => {
				console.log('read file contents completed', filePath, result);
				resolve(contents);
			})
		})
	}

	public async zipAppLogFolder(appName: string): Promise<string> {
		await this.waitForInit();
		const plugin = await this.get();
		return new Promise<string>((resolve) => {
			plugin.zipAppLogFolder(appName, (result, contents) => {
				console.log('zipped directory done, reading binary result', appName, result);
				resolve(contents);
			})
		})
	}

	public async get() {
		await this.waitForInit();
		return this.simpleIOPlugin.get();
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>((resolve) => {
			const dbWait = () => {
				// console.log('Promise waiting for db');
				if (this.initialized) {
					// console.log('wait for db init complete');
					resolve();
				} 
				else {
					// console.log('waiting for db init');
					setTimeout(() => dbWait(), 50);
				}
			}
			dbWait();
		});
	}
}
