import { Injectable } from '@angular/core';
import { IGameEventsPlugin } from './game-events-plugin.interface';

declare let OverwolfPlugin: any;

@Injectable()
export class GameEventsPluginService extends IGameEventsPlugin {
	private gameEventsPlugin: any;

	private initialized = false;
	private initializing = false;

	public override async init(onGameEventReceived: (gameEvent) => void) {
		if (this.initialized || this.initializing) {
			return;
		}

		this.gameEventsPlugin = new OverwolfPlugin('overwolf-replay-converter', true);
		this.initializing = true;
		try {
			this.gameEventsPlugin.initialize((status: boolean) => {
				if (status === false) {
					console.error("[game-events] Plugin couldn't be loaded??", 'retrying');
					setTimeout(() => this.init(onGameEventReceived), 2000);
					return;
				}
				console.log('[game-events] Plugin ' + this.gameEventsPlugin.get()._PluginName_ + ' was loaded!');
				this.initialized = true;
				this.initializing = false;
			});
			const plugin = await this.get();
			plugin.onGlobalEvent.addListener((first: string, second: string) => {
				if (first && first.includes('ERROR TO LOG')) {
					console.error('[game-events] received global event', first, second);
				} else {
					console.log('[game-events] received global event', first, second);
				}
			});
			plugin.onGameEvent.addListener((gameEvent) => {
				try {
					const events: any | readonly any[] = JSON.parse(gameEvent);
					if (!!(events as readonly any[]).length) {
						for (const event of events as readonly any[]) {
							onGameEventReceived(event);
						}
					} else {
						onGameEventReceived(events);
					}
				} catch (e) {
					console.error('[game-events]', 'Error while parsing game event', gameEvent, e);
				}
			});
			plugin.initRealtimeLogConversion(() => {
				console.log('[game-events] real-time log processing ready to go');
			});
		} catch (e) {
			console.warn('Could not load plugin, retrying', e);
			setTimeout(() => this.init(onGameEventReceived), 2000);
		}
	}

	public override async isReady(): Promise<boolean> {
		await this.waitForInit();
		return true;
	}

	public override async askForGameStateUpdate() {
		const plugin = await this.get();
		plugin.askForGameStateUpdate();
	}

	public override async realtimeLogProcessing(lines: readonly string[]) {
		const plugin = await this.get();
		return new Promise<void>((resolve) => {
			plugin.realtimeLogProcessing(lines, () => resolve());
		});
	}

	private async get() {
		await this.waitForInit();
		return this.gameEventsPlugin.get();
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
