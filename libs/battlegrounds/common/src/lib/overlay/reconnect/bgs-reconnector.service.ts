import { Injectable } from '@angular/core';
import { GameConnectionService } from '@firestone/game-state';
import { waitForReady } from '@firestone/shared/framework/core';
import { BgsReconnectorPluginService } from './bgs-reconnector-plugin.service';

@Injectable({ providedIn: 'root' })
export class BgsReconnectorService {
	constructor(
		private readonly plugin: BgsReconnectorPluginService,
		private readonly gameConnection: GameConnectionService,
	) {}

	public async reconnect() {
		await waitForReady(this.gameConnection);

		const plugin = await this.plugin.getPlugin();
		const remoteInfo = this.gameConnection.currentGameServerInfo$$.value;
		console.debug('[bgs-reconnector] current remote info', remoteInfo);
		if (!remoteInfo) {
			console.warn('[bgs-reconnector] no remote info found, not reconnecting');
			return;
		}
		return new Promise<string>((resolve) => {
			plugin.triggerReconnect(remoteInfo.address, remoteInfo.port, (result: string) => {
				console.log('[bgs-reconnector] reconnection result', result);
				resolve(result);
			});
		});
	}
}
