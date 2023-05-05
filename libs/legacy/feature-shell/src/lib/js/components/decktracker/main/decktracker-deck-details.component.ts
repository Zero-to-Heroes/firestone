import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { GameStat } from '@firestone/stats/data-access';
import { Observable, combineLatest } from 'rxjs';
import { DeckSummary } from '../../../models/mainwindow/decktracker/deck-summary';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { ConstructedEjectDeckVersionEvent } from '../../../services/mainwindow/store/events/decktracker/constructed-eject-deck-version-event';
import { ConstructedToggleDeckVersionStatsEvent } from '../../../services/mainwindow/store/events/decktracker/constructed-toggle-deck-version-stats-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'decktracker-deck-details',
	styleUrls: [`../../../../css/component/decktracker/main/decktracker-deck-details.component.scss`],
	template: `
		<div
			class="decktracker-deck-details"
			*ngIf="{
				deck: deck$ | async,
				selectedDeck: selectedDeck$ | async,
				selectedVersion: selectedVersion$ | async
			} as value"
		>
			<decktracker-stats-for-replays
				class="global-stats"
				[replays]="replays$ | async"
			></decktracker-stats-for-replays>
			<div class="container">
				<div
					class="deck-versions"
					*ngIf="value.deck?.allVersions?.length && value.deck?.allVersions?.length > 1"
				>
					<div class="header" [owTranslate]="'app.decktracker.decks.versions.title'"></div>
					<div
						class="version"
						*ngFor="let version of value.deck.allVersions"
						[ngClass]="{
							inactive: value.selectedVersion && value.selectedVersion !== version.deckstring,
							archived: version.hidden
						}"
					>
						<div class="background-image" [style.background-image]="version.backgroundImage"></div>
						<div class="gradiant"></div>
						<div
							class="archived-icon"
							[helpTooltip]="'app.decktracker.deck-details.deck-archived' | owTranslate"
						>
							<svg class="svg-icon-fill">
								<use
									xmlns:xlink="https://www.w3.org/1999/xlink"
									xlink:href="assets/svg/sprite.svg#show"
								></use>
							</svg>
						</div>
						<div
							class="deck-name"
							[helpTooltip]="getVersionTooltip(version, value.selectedVersion)"
							(click)="toggleVersionStats(version)"
						>
							{{ version.deckName }}
						</div>
						<!-- <div class="matches-played">{{ version.totalGames }}</div> -->
						<div
							class="eject-version-button"
							inlineSVG="assets/svg/close.svg"
							(click)="ejectVersion(version, value.deck)"
						></div>
					</div>
				</div>
				<div class="deck-list-container">
					<copy-deckstring
						class="copy-deckcode"
						[deckstring]="value.selectedDeck?.deckstring"
						[copyText]="'app.decktracker.deck-details.copy-deck-code-button' | owTranslate"
					>
					</copy-deckstring>

					<deck-list-static
						class="deck-list"
						[deckstring]="value.selectedDeck?.deckstring"
					></deck-list-static>
				</div>
				<deck-winrate-matrix
					[deck]="value.selectedDeck"
					[showMatchupAsPercentagesValue]="showMatchupAsPercentages$ | async"
					[ngClass]="{
						'with-versions': value.deck?.allVersions?.length && value.deck?.allVersions?.length > 1
					}"
				>
				</deck-winrate-matrix>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerDeckDetailsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	replays$: Observable<readonly GameStat[]>;
	deck$: Observable<DeckSummary>;
	selectedVersion$: Observable<string>;
	selectedDeck$: Observable<DeckSummary>;
	showMatchupAsPercentages$: Observable<boolean>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.deck$ = combineLatest(
			this.store.decks$(),
			this.store.listen$(([main, nav, prefs]) => nav.navigationDecktracker.selectedDeckstring),
		).pipe(
			this.mapData(([decks, [selectedDeckstring]]) =>
				(decks ?? []).find(
					(deck) =>
						deck.deckstring === selectedDeckstring ||
						(deck.allVersions?.map((v) => v.deckstring) ?? []).includes(selectedDeckstring),
				),
			),
		);
		this.selectedVersion$ = this.store
			.listen$(([main, nav]) => nav.navigationDecktracker.selectedVersionDeckstring)
			.pipe(this.mapData(([deckstring]) => deckstring));
		this.selectedDeck$ = combineLatest(this.deck$, this.selectedVersion$).pipe(
			this.mapData(([deck, selectedVersion]) => {
				if (!selectedVersion) {
					return deck;
				}
				return deck.allVersions?.find((v) => v.deckstring === selectedVersion);
			}),
		);
		this.replays$ = this.deck$.pipe(this.mapData((deck) => deck?.replays ?? []));
		this.showMatchupAsPercentages$ = this.listenForBasicPref$((prefs) => prefs.desktopDeckShowMatchupAsPercentages);
	}

	ejectVersion(version: DeckSummary, deck: DeckSummary) {
		this.store.send(new ConstructedEjectDeckVersionEvent(version.deckstring, deck));
	}

	toggleVersionStats(version: DeckSummary) {
		this.store.send(new ConstructedToggleDeckVersionStatsEvent(version.deckstring));
	}

	getVersionTooltip(version: DeckSummary, selectedVersion: string): string {
		if (version.deckstring !== selectedVersion) {
			return this.i18n.translateString('app.decktracker.decks.versions.click-to-view-version-stats-tooltip');
		}
		return this.i18n.translateString('app.decktracker.decks.versions.click-to-view-all-stats-tooltip');
	}
}
