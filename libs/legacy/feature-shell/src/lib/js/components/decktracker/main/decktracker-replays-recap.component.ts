import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ConstructedNavigationService } from '@firestone/constructed/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { Observable, combineLatest } from 'rxjs';
import { DecksProviderService } from '../../../services/decktracker/main/decks-provider.service';

@Component({
	selector: 'decktracker-replays-recap',
	styleUrls: [`../../../../css/component/decktracker/main/decktracker-replays-recap.component.scss`],
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

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly decks: DecksProviderService,
		private readonly nav: ConstructedNavigationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.decks);

		this.replays$ = combineLatest([
			this.decks.decks$$,
			this.nav.selectedDeckstring$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.replaysActiveDeckstringsFilter)),
		]).pipe(
			this.mapData(([decks, selectedDeckstring, deckstringsFilter]) =>
				(decks ?? [])
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

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
