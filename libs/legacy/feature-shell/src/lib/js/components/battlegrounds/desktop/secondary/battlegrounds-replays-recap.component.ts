import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BattlegroundsNavigationService } from '@firestone/battlegrounds/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { GameStatsProviderService } from '@legacy-import/src/lib/js/services/stats/game/game-stats-provider.service';
import { Observable, combineLatest } from 'rxjs';
import { isBattlegrounds, normalizeHeroCardId } from '../../../../services/battlegrounds/bgs-utils';

@Component({
	selector: 'battlegrounds-replays-recap',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/secondary/battlegrounds-replays-recap.component.scss`,
	],
	template: `
		<div class="battlegrounds-replays-recap" *ngIf="replays$ | async as replays">
			<div
				class="title"
				[owTranslate]="'app.decktracker.replays-recap.header'"
				[translateParams]="{ value: replays.length }"
			></div>
			<ul class="list">
				<li *ngFor="let replay of replays; trackBy: trackByFn">
					<replay-info
						[replay]="replay"
						[showStatsLabel]="null"
						[showReplayLabel]="null"
						[displayTime]="false"
					></replay-info>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsReplaysRecapComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	replays$: Observable<readonly GameStat[]>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly gameStats: GameStatsProviderService,
		private readonly nav: BattlegroundsNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.gameStats, this.nav);

		this.replays$ = combineLatest([this.gameStats.gameStats$$, this.nav.selectedCategoryId$$]).pipe(
			this.mapData(([replays, selectedCategoryId]) => {
				const heroId = selectedCategoryId?.split('bgs-category-personal-hero-details-')?.[1];
				return replays
					.filter((replay) => isBattlegrounds(replay.gameMode))
					.filter((replay) => replay.playerRank != null)
					.filter(
						(replay) =>
							!heroId ||
							normalizeHeroCardId(heroId, this.allCards) ===
								normalizeHeroCardId(replay.playerCardId, this.allCards),
					)
					.slice(0, 10);
			}),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByFn(index, item: GameStat) {
		return item.reviewId;
	}
}
