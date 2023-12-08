import { Injectable } from '@angular/core';
import { DiscordRPCPlugin } from './discord-rpc-plugin.types';

declare let OverwolfPlugin: any;

@Injectable()
export class DiscordRpcPluginService {
	private plugin: DiscordRPCPlugin;

	private initialized = false;
	private initializing = false;

	public async init() {
		if (this.initialized || this.initializing) {
			return;
		}

		console.debug('[discord] initializing plugin');
		this.initializing = true;
		return new Promise<void>((resolve) => {
			const plugin = new OverwolfPlugin('DiscordRPCPlugin', true);

			plugin.initialize(async (status: boolean) => {
				this.plugin = await plugin.get();
				console.log('[discord] Plugin was loaded!', status, this.plugin, plugin);
				this.initialized = true;
				this.initializing = false;
				resolve();
			});
		});
	}

	public async getPlugin(): Promise<DiscordRPCPlugin> {
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
