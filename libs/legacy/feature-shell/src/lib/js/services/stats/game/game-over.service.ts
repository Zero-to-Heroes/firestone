import { Injectable } from '@angular/core';

import { BgsBestUserStatsService, GameStateFacadeService } from '@firestone/game-state';
import { Events } from '@firestone/shared/common/service';
import { ManastormInfo } from '@firestone/app/common';

@Injectable()
export class GameOverService {
	constructor(
		private readonly gameState: GameStateFacadeService,
		private readonly events: Events,
		private readonly bgsUserStatsService: BgsBestUserStatsService,
	) {
		this.init();
	}

	private async init() {
		this.events.on(Events.REVIEW_FINALIZED).subscribe(async (event) => {
			const info: ManastormInfo = event.data[0];
			console.debug('[game-state] Replay created, received info', info.type);
			// FIXME: this could be an issue if the review_finalized event takes too long to fire, as the state
			// could be already reset when it arrives
			const state = this.gameState.gameState$$.getValue();
			if (info && info.type === 'new-review' && state?.bgState?.currentGame) {
				const currentGame = state.bgState.currentGame;
				console.debug('[game-state] will trigger START_BGS_RUN_STATS', state);
				const bestBgsUserStats = await this.bgsUserStatsService.bestStats$$.getValueWithInit();
				this.events.broadcast(
					Events.START_BGS_RUN_STATS,
					info.reviewId,
					currentGame,
					bestBgsUserStats,
					info.game,
				);
			}
		});
	}
}
