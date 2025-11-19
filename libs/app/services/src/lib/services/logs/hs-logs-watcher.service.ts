import { Injectable } from '@angular/core';
import { GameConnectionService } from '@firestone/game-state';

const regex = /Network\.GotoGameServe.*address=[ ]*(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{1,5})/;

@Injectable({ providedIn: 'root' })
export class HsLogsWatcherService {
	constructor(private readonly gameConnection: GameConnectionService) {}

	public receiveExistingLogLine(existingLine: string): void {
		this.handleLogLine(existingLine);
	}

	public receiveLogLine(data: string): void {
		this.handleLogLine(data);
	}

	private handleLogLine(data: string): void {
		const match = data.match(regex);
		// console.debug('[hearthstone-log] match', data, match);
		if (match) {
			const remoteAddress = match[1];
			const remotePort = match[2];
			console.log('[hearthstone-log] remoteAddress', remoteAddress, 'remotePort', remotePort);
			this.gameConnection.updateGameServerInfo(remoteAddress, parseInt(remotePort, 10));
		}
	}
}
