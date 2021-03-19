import { Injectable } from '@angular/core';

declare let OverwolfPlugin: any;

@Injectable()
export class GameEventsPluginService {
	private gameEventsPlugin: any;
	initialized = false;

	constructor() {
		this.gameEventsPlugin = new OverwolfPlugin('overwolf-replay-converter', true);
		this.initialize();
	}

	async initialize() {
		this.initialized = false;
		try {
			this.gameEventsPlugin.initialize((status: boolean) => {
				if (status === false) {
					console.error("[game-events] Plugin couldn't be loaded??", 'retrying');
					setTimeout(() => this.initialize(), 2000);
					return;
				}
				console.log('[game-events] Plugin ' + this.gameEventsPlugin.get()._PluginName_ + ' was loaded!');
				this.initialized = true;
			});
			const plugin = await this.get();
			plugin.onGlobalEvent.addListener((first: string, second: string) => {
				if (first && first.includes('ERROR TO LOG')) {
					console.error('[game-events] received global event', first, second);
				}
			});
		} catch (e) {
			console.warn('Could not load plugin, retrying', e);
			setTimeout(() => this.initialize(), 2000);
		}
	}

	public async get() {
		await this.waitForInit();
		return this.gameEventsPlugin.get();
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
