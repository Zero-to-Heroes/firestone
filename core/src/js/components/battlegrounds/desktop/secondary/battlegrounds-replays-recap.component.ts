import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { BattlegroundsPersonalStatsHeroDetailsCategory } from '../../../../models/mainwindow/battlegrounds/categories/battlegrounds-personal-stats-hero-details-category';
import { GameStat } from '../../../../models/mainwindow/stats/game-stat';
import { AppUiStoreService, cdLog } from '../../../../services/app-ui-store.service';
import { arraysEqual } from '../../../../services/utils';

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
export class BattlegroundsReplaysRecapComponent {
	replays$: Observable<readonly GameStat[]>;

	constructor(private readonly store: AppUiStoreService) {
		this.replays$ = this.store
			.listen$(
				([main, nav]) => main.replays.allReplays,
				([main, nav]) => main.battlegrounds.findCategory(nav.navigationBattlegrounds.selectedCategoryId),
			)
			.pipe(
				tap(([replays, category]) => console.debug('considering', replays, category)),
				filter(([replays, category]) => !!replays?.length && !!category),
				map(([replays, category]) => {
					const heroId = (category as BattlegroundsPersonalStatsHeroDetailsCategory).heroId;
					return (
						replays
							.filter((replay) => replay.gameMode === 'battlegrounds')
							.filter((replay) => replay.playerRank != null)
							.filter((replay) => !heroId || heroId === replay.playerCardId)
							// TODO: how to allow this to be a parameter?
							.slice(0, 10)
					);
				}),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
				tap((info) => cdLog('emitting replays in ', this.constructor.name, info)),
			);
	}

	trackByFn(index, item: GameStat) {
		return item.reviewId;
	}
}
