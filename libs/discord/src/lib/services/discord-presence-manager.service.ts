/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { filter } from 'rxjs';
import { DiscordRpcService } from './discord-rpc.service';
import { PresenceManagerService } from './presence-manager.service';

export const IN_GAME_TEXT_PLACEHOLDER = 'In game';

@Injectable()
export class DiscordPresenceManagerService {
	constructor(
		private readonly presenceManager: PresenceManagerService,
		private readonly discordRpc: DiscordRpcService,
	) {
		this.init();
	}

	// TODO: use different app ID based on premium/non premium to customize main text?
	private async init() {
		this.presenceManager.presence$$.pipe(filter((presence) => !!presence)).subscribe(async (presence) => {
			console.debug('[discord-presence] got new presence', presence);
			if (presence?.inGame && presence.enabled) {
				await this.discordRpc.updatePresence(
					presence.text || IN_GAME_TEXT_PLACEHOLDER,
					'',
					'', // Use rank image?
					'', // Small image tooltip
				);
			} else {
				this.discordRpc.clearPresence();
			}
		});
	}
}
