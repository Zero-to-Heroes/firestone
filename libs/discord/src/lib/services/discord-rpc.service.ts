import { Injectable } from '@angular/core';
import { DiscordRpcPluginService } from './discord-rpc-plugin.service';
import { DiscordRPCPlugin } from './discord-rpc-plugin.types';

@Injectable()
export class DiscordRpcService {
	private plugin: DiscordRPCPlugin;

	constructor(private readonly pluginService: DiscordRpcPluginService) {}

	public async init() {
		this.plugin = await this.pluginService.getPlugin();

		this.plugin.onClientReady.addListener((info) => console.log('[discord] client ready', info));
		this.plugin.onPresenceUpdate.addListener((info) => console.log('[discord] presence update', info));
		this.plugin.onClientError.addListener((info) => console.error('[discord] client error', info));
		this.plugin.onLogLine.addListener((info) => console.log('[discord] log line', info));
	}

	public async updatePresence(details: string, state: string, smallImageKey: string, smallImageText: string) {
		this.plugin.updatePresence(
			details,
			state,
			'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/tray_icon.png',
			'Firestone Companion App',
			smallImageKey,
			smallImageText,
			true,
			0,
			'Button 1',
			'https://button1.url',
			'Button 2',
			'https://button2.url',
			console.log,
		);
	}
}
