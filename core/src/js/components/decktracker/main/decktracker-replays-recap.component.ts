import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
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
				{{ 'app.decktracker.replays-recap.header' | owTranslate: { value: replays.length } }}
				<replays-icon-toggle class="icon-toggle"></replays-icon-toggle>
			</div>
			<div
				class="title"
				*ngIf="!replays?.length"
				[owTranslate]="'app.decktracker.replays-recap.no-replays'"
			></div>
			<ul class="list" scrollable>
				<li *ngFor="let replay of replays">
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
export class DecktrackerReplaysRecapComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	replays$: Observable<readonly GameStat[]>;

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.replays$ = combineLatest(
			this.store.listen$(
				([main, nav, prefs]) => main.decktracker.decks,
				([main, nav, prefs]) => nav.navigationDecktracker.selectedDeckstring,
			),
			this.store.listenPrefs$((prefs) => prefs.replaysActiveDeckstringsFilter),
		).pipe(
			this.mapData(([[decks, selectedDeckstring], [deckstringsFilter]]) =>
				decks
					.filter((deck) =>
						selectedDeckstring
							? deck.deckstring === selectedDeckstring ||
							  (deck.allVersions?.map((v) => v.deckstring) ?? []).includes(selectedDeckstring)
							: true,
					)
					.filter(
						(deck) =>
							!deckstringsFilter?.length ||
							deckstringsFilter.includes(deck.deckstring) ||
							(deck.allVersions?.map((v) => v.deckstring) ?? []).some((d) =>
								deckstringsFilter.includes(d),
							),
					)
					.flatMap((deck) => deck.replays)
					.sort((a: GameStat, b: GameStat) => (a.creationTimestamp <= b.creationTimestamp ? 1 : -1))
					.slice(0, 20),
			),
		);
	}
}
