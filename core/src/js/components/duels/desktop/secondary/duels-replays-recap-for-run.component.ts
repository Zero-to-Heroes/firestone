import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { GameStat } from '../../../../models/mainwindow/stats/game-stat';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../../abstract-subscription.component';

@Component({
	selector: 'duels-replays-recap-for-run',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/duels/desktop/secondary/duels-replays-recap.component.scss`,
		`../../../../../css/component/duels/desktop/secondary/duels-replays-recap-for-run.component.scss`,
	],
	template: `
		<div class="duels-replays-recap">
			<div class="title" [owTranslate]="'app.duels.run.replays-title'"></div>
			<ul class="list">
				<li *ngFor="let replay of replays$ | async">
					<replay-info [replay]="replay" [showStatsLabel]="null" [showReplayLabel]="null"></replay-info>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsReplaysRecapForRunComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	replays$: Observable<readonly GameStat[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.replays$ = this.store
			.listen$(
				([main, nav, prefs]) => main.duels.personalDeckStats,
				([main, nav, prefs]) => nav.navigationReplays.selectedReplay,
			)
			.pipe(
				this.mapData(([duelsDeckStats, selectedReplay]) => {
					const runId = selectedReplay?.replayInfo?.runId;
					if (!runId) {
						return [];
					}
					return duelsDeckStats
						.map((deck) => deck.runs)
						.reduce((a, b) => a.concat(b), [])
						.filter((run) => run.id === runId)
						.map((run) => run.steps)
						.reduce((a, b) => a.concat(b), [])
						.filter((step) => (step as GameStat).opponentCardId)
						.map((step) => step as GameStat)
						.sort((a: GameStat, b: GameStat) => {
							if (a.creationTimestamp <= b.creationTimestamp) {
								return 1;
							}
							return -1;
						})
						.slice(0, 20);
				}),
			);
	}
}
