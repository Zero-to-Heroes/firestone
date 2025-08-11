import { EventEmitter, Injectable } from '@angular/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { buildGameStat } from '@firestone/stats/services';
import { Events } from '@firestone/shared/common/service';
import { MainWindowStoreEvent } from '../../mainwindow/store/events/main-window-store-event';
import { RecomputeGameStatsEvent } from '../../mainwindow/store/events/stats/recompute-game-stats-event';
import { ManastormInfo } from '@firestone/app/common';

@Injectable()
export class GameStatsUpdaterService {
	// This is set directly by the store
	public stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly events: Events,
		private readonly allCards: CardsFacadeService,
	) {
		this.init();
	}

	private async init() {
		// For now we keep the main store as the source of truth, but maybe this should be moved away at some point?
		this.events.on(Events.REVIEW_FINALIZED).subscribe(async (data) => {
			const info: ManastormInfo = data.data[0];
			const newGameStat: GameStat = buildGameStat(
				info.reviewId,
				info.game,
				info.xml,
				info.metadata,
				this.allCards,
			);
			console.log('​[manastorm-bridge] built new game stat', newGameStat.reviewId);
			console.debug('​[manastorm-bridge] built new game stat', newGameStat);
			this.stateUpdater.next(new RecomputeGameStatsEvent(newGameStat));
		});
	}
}
