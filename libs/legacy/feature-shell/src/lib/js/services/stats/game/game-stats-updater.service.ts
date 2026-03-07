import { Injectable } from '@angular/core';
import { ManastormInfo } from '@firestone/app/common';
import { Events } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { buildGameStat } from '@firestone/stats/services';
import { RecomputeGameStatsEvent } from '@firestone/mainwindow/common';
import { MainWindowStoreService } from '../../mainwindow/store/main-window-store.service';

@Injectable()
export class GameStatsUpdaterService {
	constructor(
		private readonly events: Events,
		private readonly allCards: CardsFacadeService,
		private readonly store: MainWindowStoreService,
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
			this.store.send(new RecomputeGameStatsEvent(newGameStat));
		});
	}
}
