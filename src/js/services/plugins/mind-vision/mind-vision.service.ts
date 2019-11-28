import { Injectable } from '@angular/core';

declare var OverwolfPlugin: any;

@Injectable()
export class MindVisionService {
	private mindVisionPlugin: any;
	initialized = false;

	constructor() {
		this.initialize();
	}

	public async getCollection(): Promise<any[]> {
		return new Promise<any[]>(async (resolve, reject) => {
			console.log('[mind-vision] retrieving collection');
			const plugin = await this.get();
			try {
				plugin.getCollection(collection => {
					console.log('[mind-vision] retrieved collection');
					resolve(collection ? JSON.parse(collection) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse collection', e);
				resolve(null);
			}
		});
	}

	public async getMatchInfo(): Promise<any> {
		return new Promise<any[]>(async resolve => {
			console.log('[mind-vision] retrieving matchInfo');
			const plugin = await this.get();
			try {
				plugin.getMatchInfo(matchInfo => {
					resolve(matchInfo ? JSON.parse(matchInfo) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse matchInfo', e);
				resolve(null);
			}
		});
	}

	public async getBattlegroundsInfo(): Promise<{ Rating: number; PreviousRating: number }> {
		return new Promise<{ Rating: number; PreviousRating: number }>(async resolve => {
			console.log('[mind-vision] retrieving getBattlegroundsInfo');
			const plugin = await this.get();
			try {
				plugin.getBattlegroundsInfo(battlegroundsInfo => {
					console.log('[mind-vision] retrieved getBattlegroundsInfo', battlegroundsInfo);
					resolve(battlegroundsInfo ? JSON.parse(battlegroundsInfo) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse battlegroundsInfo', e);
				resolve(null);
			}
		});
	}

	public async getDungeonInfo(): Promise<any> {
		return new Promise<any[]>(async resolve => {
			console.log('[mind-vision] retrieving dungeonInfo');
			const plugin = await this.get();
			try {
				plugin.getDungeonInfo(dungeonInfo => {
					console.log('[mind-vision] retrieved dungeonInfo');
					resolve(dungeonInfo ? JSON.parse(dungeonInfo) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse dungeonInfo', e);
				resolve(null);
			}
		});
	}

	public async getActiveDeck(): Promise<any> {
		return new Promise<any[]>(async resolve => {
			console.log('[mind-vision] retrieving activeDeck');
			const plugin = await this.get();
			try {
				plugin.getActiveDeck(activeDeck => {
					console.log('[mind-vision] retrieved activeDeck', activeDeck);
					resolve(activeDeck ? JSON.parse(activeDeck) : null);
				});
			} catch (e) {
				console.log('[mind-vision] could not parse activeDeck', e);
				resolve(null);
			}
		});
	}

	public async get() {
		await this.waitForInit();
		return this.mindVisionPlugin.get();
	}

	private initialize() {
		this.initialized = false;
		try {
			console.log('[mind-vision] plugin init starting', this.mindVisionPlugin);
			this.mindVisionPlugin = new OverwolfPlugin('mind-vision', true);
			this.mindVisionPlugin.initialize(async (status: boolean) => {
				if (status === false) {
					console.error("[mind-vision] Plugin couldn't be loaded??", 'retrying');
					setTimeout(() => this.initialize(), 2000);
					return;
				}
				console.log('[mind-vision] Plugin ' + this.mindVisionPlugin.get()._PluginName_ + ' was loaded!');
				this.mindVisionPlugin.get().onGlobalEvent.addListener((first: string, second: string) => {
					console.log('[mind-vision] received global event', first, second);
				});
				this.initialized = true;
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
