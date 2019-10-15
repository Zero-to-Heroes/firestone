import { Injectable } from '@angular/core';

declare var OverwolfPlugin: any;

@Injectable()
export class MindVisionService {
	private mindVisionPlugin: any;
	initialized = false;

	constructor() {
		this.mindVisionPlugin = new OverwolfPlugin('mind-vision', true);
		this.initialize();
	}

	public async getCollection(): Promise<any[]> {
		return new Promise<any[]>(async resolve => {
			const plugin = await this.get();
			plugin.getCollection(collection => {
				try {
					if (collection) {
						// console.debug('[mind-vision] retrieved collection', collection);
						resolve(JSON.parse(collection));
					}
				} catch (e) {
					console.debug('[mind-vision] could not parse collection', e, collection);
				}
			});
		});
	}

	public async getMatchInfo(): Promise<any> {
		return new Promise<any[]>(async resolve => {
			const plugin = await this.get();
			plugin.getMatchInfo(matchInfo => {
				try {
					if (matchInfo) {
						console.debug('[mind-vision] retrieved matchInfo', matchInfo);
						resolve(JSON.parse(matchInfo));
					}
				} catch (e) {
					console.debug('[mind-vision] could not parse matchInfo', e, matchInfo);
				}
			});
		});
	}

	public async get() {
		await this.waitForInit();
		return this.mindVisionPlugin.get();
	}

	private initialize() {
		this.initialized = false;
		try {
			this.mindVisionPlugin.initialize((status: boolean) => {
				if (status === false) {
					console.error("[mind-vision] Plugin couldn't be loaded??", 'retrying');
					setTimeout(() => this.initialize(), 2000);
					return;
				}
				console.log('[mind-vision] Plugin ' + this.mindVisionPlugin.get()._PluginName_ + ' was loaded!');
				this.initialized = true;
				this.mindVisionPlugin.get().onGlobalEvent.addListener((first: string, second: string) => {
					console.log('[mind-vision] received global event', first, second);
				});
			});
		} catch (e) {
			console.warn('[mind-vision]Could not load plugin, retrying', e);
			setTimeout(() => this.initialize(), 2000);
		}
	}

	private waitForInit(): Promise<void> {
		return new Promise<void>(resolve => {
			const dbWait = () => {
				if (this.initialized) {
					resolve();
				} else {
					// console.log('[game-events] waiting for init');
					setTimeout(() => dbWait(), 50);
				}
			};
			dbWait();
		});
	}
}
