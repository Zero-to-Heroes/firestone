import { Injectable } from '@angular/core';
import { PlayerInfo } from '../models/player-info';
import { Events } from './events.service';
import { MemoryInspectionService } from './plugins/memory-inspection.service';

@Injectable()
export class PlayersInfoService {
	private playerInfo: PlayerInfo;
	private opponentInfo: PlayerInfo;

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
		console.warn('[players-info] playerInfo not present in cache, fetching it from GEP');
		const infoFromGep = await this.memoryService.getPlayerInfo();
		return infoFromGep.localPlayer;
	}

	public async getOpponentInfo(): Promise<PlayerInfo> {
		if (this.opponentInfo) {
			return this.opponentInfo;
		}
		// It's usually less important to have the opponent info, so we only add this as a log
		console.log('[players-info] opponentInfo not present in cache, fetching it from GEP');
		const infoFromGep = await this.memoryService.getPlayerInfo();
		return infoFromGep.opponent;
	}
}
