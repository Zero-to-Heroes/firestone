/* eslint-disable no-async-promise-executor */
import { Injectable } from '@angular/core';
import { sleep } from '@firestone/shared/framework/common';
import { DiscordRpcPluginService } from './discord-rpc-plugin.service';
import { DiscordRPCPlugin, LogLevel } from './discord-rpc-plugin.types';

const FIRESTONE_DISCORD_APP_ID = '1181612319495696494';

@Injectable()
export class DiscordRpcService {
	private plugin: DiscordRPCPlugin;

	private status: 'offline' | 'initializing' | 'online' = 'offline';

	constructor(private readonly pluginService: DiscordRpcPluginService) {}

	public async init() {
		if (this.status !== 'offline') {
			return;
		}

		return new Promise<void>(async (resolve) => {
			console.debug('[discord] initializing plugin');
			this.status = 'initializing';
			if (!this.plugin) {
				console.debug('[discord] no plugin, building new one');
				this.plugin = await this.pluginService.getPlugin();
				this.plugin.onClientReady.addListener((info) => {
					console.debug('[discord-presence] client ready', info);
					this.status = 'online';
				});
				this.plugin.onPresenceUpdate.addListener((info) =>
					console.log('[discord-presence] presence update', info),
				);
				this.plugin.onClientError.addListener((info) => console.error('[discord-presence] client error', info));
				this.plugin.onLogLine.addListener((info) => console.debug('[discord-presence] log line', info.message));
			}

			console.debug('[discord] calling plugin.initialize()');
			this.plugin.initialize(FIRESTONE_DISCORD_APP_ID, LogLevel.Warning, (response) => {
				console.debug('[discord] plugin initialized', response);
				resolve();
			});
		});
	}

	public async updatePresence(details: string, state: string, smallImageKey: string, smallImageText: string) {
		if (this.status !== 'online') {
			await this.init();
		}
		await this.ready();

		this.plugin.updatePresence(
			details,
			state,
			'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/tray_icon.png',
			'Firestone Companion App',
			smallImageKey,
			smallImageText,
			true,
			0,
			'Get the app',
			'https://www.firestoneapp.com?utm_source=discord_rpc',
			'',
			'',
			// 'Button 2',
			// 'https://button2.url',
			console.log,
		);
	}

	public clearPresence() {
		if (this.status !== 'online') {
			return;
		}

		this.plugin.dispose((info) => {
			console.log('[discord] dispose', info);
			this.status = 'offline';
		});
	}

	private async ready() {
		while (!this.plugin) {
			await sleep(500);
		}
		return;
	}
}
