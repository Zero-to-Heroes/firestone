import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'decktracker-replays-recap',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/decktracker/main/decktracker-replays-recap.component.scss`,
	],
	template: `
		<div class="decktracker-replays-recap" *ngIf="replays$ | async as replays">
			<div class="title" *ngIf="!!replays.length">
				Last {{ replays.lenth }} replays
				<replays-icon-toggle class="icon-toggle"></replays-icon-toggle>
			</div>
			<div class="title" *ngIf="!replays?.length">No replays</div>
			<ul class="list" scrollable>
				<li *ngFor="let replay of replays">
					<replay-info [replay]="replay" [showStatsLabel]="null" [showReplayLabel]="null"></replay-info>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerReplaysRecapComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	replays$: Observable<readonly GameStat[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.replays$ = this.store
			.listen$(
				([main, nav, prefs]) => main.decktracker.decks,
				([main, nav, prefs]) => nav.navigationDecktracker.selectedDeckstring,
			)
			.pipe(
				this.mapData(([decks, selectedDeckstring]) =>
					((decks?.map((deck) => deck.replays).reduce((a, b) => a.concat(b), []) as GameStat[]) ?? [])
						.filter((stat) => (selectedDeckstring ? stat.playerDecklist === selectedDeckstring : true))
						.sort((a: GameStat, b: GameStat) => {
							if (a.creationTimestamp <= b.creationTimestamp) {
								return 1;
							}
							return -1;
						})
						.slice(0, 20),
				),
			);
	}
}
