import { Inject, Injectable } from '@angular/core';
import { IMemoryReadingService, MEMORY_READING_SERVICE_TOKEN } from '@firestone/memory';
import { distinctUntilChanged, filter, tap } from 'rxjs';
import { DiscordRpcService } from './discord-rpc.service';

@Injectable()
export class DiscordPresenceManagerService {
	constructor(
		@Inject(MEMORY_READING_SERVICE_TOKEN) private readonly memoryService: IMemoryReadingService,
		private readonly discordRpc: DiscordRpcService,
	) {
		this.init();
	}

	private async init() {
		return;
		await this.discordRpc.init();

		console.debug('[discord-presence] init', this.memoryService, this.discordRpc);
		this.memoryService.memoryUpdates$$
			.pipe(
				tap((update) => console.debug('[discord-presence] new update', update)),
				filter((updates) => updates?.CurrentScene != null),
				distinctUntilChanged(),
			)
			.subscribe(async (updates) => {
				console.debug('[discord-presence] new scene change', updates.CurrentScene);
				this.discordRpc.updatePresence(
					'In game',
					'',
					'', // Use rank image?
					'', // Small image tooltip
				);
			});
	}
}
