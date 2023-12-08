/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { filter } from 'rxjs';
import { DiscordRpcService } from './discord-rpc.service';
import { PresenceManagerService } from './presence-manager.service';

@Injectable()
export class DiscordPresenceManagerService {
	constructor(
		private readonly presenceManager: PresenceManagerService,
		private readonly discordRpc: DiscordRpcService,
	) {
		this.init();
	}

	private async init() {
		this.presenceManager.presence$$.pipe(filter((presence) => !!presence)).subscribe(async (presence) => {
			console.debug('[discord-presence] got new presence', presence);
			if (presence?.inGame && presence.enabled) {
				await this.discordRpc.updatePresence(
					'In game',
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
