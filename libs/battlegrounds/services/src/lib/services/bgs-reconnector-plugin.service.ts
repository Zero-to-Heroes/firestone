import { Injectable } from '@angular/core';
import { BgsReconnectorPlugin } from './bgs-reconnecto-plugin.types';

declare let OverwolfPlugin: any;

@Injectable({ providedIn: 'root' })
export class BgsReconnectorPluginService {
	private plugin: BgsReconnectorPlugin;

	private initialized = false;
	private initializing = false;

	public async init() {
		if (this.initialized || this.initializing) {
			return;
		}

		console.debug('[bgs-reconnector] initializing plugin');
		this.initializing = true;
		return new Promise<void>((resolve) => {
			const plugin = new OverwolfPlugin('bgs-reconnector', true);

			plugin.initialize(async (status: boolean) => {
				this.plugin = await plugin.get();
				console.log('[bgs-reconnector] Plugin was loaded!', status);
				this.initialized = true;
				this.initializing = false;

				(this.plugin as any).onGlobalEvent.addListener((message: string) => {
					console.debug('[bgs-reconnector] received global event', message);
				});
				resolve();
			});
		});
	}

	public async getPlugin(): Promise<BgsReconnectorPlugin> {
		if (this.initialized) {
			return this.plugin;
		}

		if (!this.initializing) {
			await this.init();
		} else {
			await this.waitForInit();
		}
		return this.plugin;
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
