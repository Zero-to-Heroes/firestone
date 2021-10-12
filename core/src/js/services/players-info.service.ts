import { Injectable } from '@angular/core';
import { PlayerInfo } from '../models/player-info';
import { Events } from './events.service';
import { MemoryInspectionService } from './plugins/memory-inspection.service';

@Injectable()
export class PlayersInfoService {
	private cachedInfo: { localPlayer: PlayerInfo; opponent: PlayerInfo };
	private cacheInvalidationTimeout;

	constructor(private events: Events, private memoryService: MemoryInspectionService) {}

	public async getPlayerInfo(): Promise<PlayerInfo> {
		const infoFromGep = this.cachedInfo?.localPlayer ? this.cachedInfo : await this.memoryService.getMatchInfo();
		if (!infoFromGep) {
			console.warn('[players-info] No player info returned by mindvision', this.cachedInfo, infoFromGep);
			return null;
		}
		this.shortCache(infoFromGep);
		console.log('[players-info] retrieved player info from memory', infoFromGep.localPlayer);
		return infoFromGep.localPlayer;
	}

	// This always happen after the player_info event, so we only want to
	// look at the cache
	public async getOpponentInfo(): Promise<PlayerInfo> {
		// It's usually less important to have the opponent info, so we only add this as a log

		const infoFromGep = this.cachedInfo?.opponent ? this.cachedInfo : await this.memoryService.getMatchInfo();
		if (!infoFromGep) {
			console.warn('[players-info] No player info returned by mindvision');
			return null;
		}
		this.shortCache(infoFromGep);
		console.log('[players-info] retrieved opponent info from memory', infoFromGep.opponent);
		return infoFromGep.opponent;
	}

	private shortCache(memoryInfo) {
		this.cachedInfo = memoryInfo;
		if (this.cacheInvalidationTimeout) {
			clearTimeout(this.cacheInvalidationTimeout);
		}
		this.cacheInvalidationTimeout = setTimeout(() => {
			this.cachedInfo = null;
			this.cacheInvalidationTimeout = null;
		}, 10000);
	}
}
