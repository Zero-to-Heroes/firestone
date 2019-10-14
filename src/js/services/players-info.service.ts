import { Injectable } from '@angular/core';
import { PlayerInfo } from '../models/player-info';
import { Events } from './events.service';
import { MemoryInspectionService } from './plugins/memory-inspection.service';

@Injectable()
export class PlayersInfoService {
	public playerInfo: PlayerInfo;
	public opponentInfo: PlayerInfo;

	constructor(private events: Events, private memoryService: MemoryInspectionService) {
		this.events.on(Events.PLAYER_INFO).subscribe(event => {
			this.playerInfo = event.data[0];
		});
		this.events.on(Events.OPPONENT_INFO).subscribe(event => {
			this.opponentInfo = event.data[0];
		});
	}

	public async getPlayerInfo(): Promise<PlayerInfo> {
		if (this.playerInfo) {
			return this.playerInfo;
		}
		console.log('[players-info] playerInfo not present in cache, fetching it from GEP');
		const infoFromGep = await this.memoryService.getPlayerInfo();
		if (!infoFromGep) {
			console.error('[players-info] No player info returned from the GEP');
			return null;
		}
		return infoFromGep.localPlayer;
	}

	public async getOpponentInfo(): Promise<PlayerInfo> {
		if (this.opponentInfo) {
			return this.opponentInfo;
		}
		// It's usually less important to have the opponent info, so we only add this as a log
		console.log('[players-info] opponentInfo not present in cache, fetching it from GEP');
		const infoFromGep = await this.memoryService.getPlayerInfo();
		if (!infoFromGep) {
			console.error('[players-info] No player info returned from the GEP');
			return null;
		}
		return infoFromGep.opponent;
	}
}
