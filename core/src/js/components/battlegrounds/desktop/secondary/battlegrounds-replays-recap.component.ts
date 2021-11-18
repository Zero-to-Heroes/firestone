import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil, tap } from 'rxjs/operators';
import { BattlegroundsCategory } from '../../../../models/mainwindow/battlegrounds/battlegrounds-category';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { GameStat } from '../../../../models/mainwindow/stats/game-stat';
import { normalizeHeroCardId } from '../../../../services/battlegrounds/bgs-utils';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../../../services/utils';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'battlegrounds-replays-recap',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/secondary/battlegrounds-replays-recap.component.scss`,
		`../../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="battlegrounds-replays-recap" *ngIf="replays$ | async as replays">
			<div class="title">Last {{ replays.length }} replays</div>
			<ul class="list">
				<li *ngFor="let replay of replays; trackBy: trackByFn">
					<replay-info [replay]="replay" [showStatsLabel]="null" [showReplayLabel]="null"></replay-info>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsReplaysRecapComponent extends AbstractSubscriptionComponent {
	replays$: Observable<readonly GameStat[]>;

	constructor(
		private readonly allCards: CardsFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
		this.replays$ = this.store
			.listen$(
				([main, nav]) => main.replays.allReplays,
				([main, nav]) => main.battlegrounds,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
			)
			.pipe(
				map(
					([replays, battlegrounds, selectedCategoryId]) =>
						[replays, battlegrounds.findCategory(selectedCategoryId)] as [
							GameStat[],
							BattlegroundsCategory,
						],
				),
				filter(([replays, category]) => !!replays?.length && !!category),
				map(([replays, category]) => {
					const heroId = (category as BattlegroundsPersonalStatsHeroDetailsCategory).heroId;
					return (
						replays
							.filter((replay) => replay.gameMode === 'battlegrounds')
							.filter((replay) => replay.playerRank != null)
							.filter(
								(replay) =>
									!heroId ||
									normalizeHeroCardId(heroId, true, this.allCards) ===
										normalizeHeroCardId(replay.playerCardId, true, this.allCards),
							)
							// TODO: how to allow this to be a parameter?
							.slice(0, 10)
					);
				}),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				tap((info) => cdLog('emitting replays in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
	}

	trackByFn(index, item: GameStat) {
		return item.reviewId;
	}
}
