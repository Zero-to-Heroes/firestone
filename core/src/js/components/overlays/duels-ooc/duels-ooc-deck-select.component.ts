import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionComponent } from '@components/abstract-subscription.component';
import { DuelsDeckWidgetDeck } from '@components/overlays/duels-ooc/duels-deck-widget-deck';
import { allDuelsSignatureTreasures, CardIds } from '@firestone-hs/reference-data';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { DuelsGroupedDecks } from '@models/duels/duels-grouped-decks';
import { DuelsDeckStat } from '@models/duels/duels-player-stats';
import { DuelsRun } from '@models/duels/duels-run';
import { GameStat } from '@models/mainwindow/stats/game-stat';
import { DuelsDeck } from '@models/memory/memory-duels';
import { SetCard } from '@models/set';
import { CardsFacadeService } from '@services/cards-facade.service';
import { isPassive } from '@services/duels/duels-utils';
import { DuelsBuildDeckEvent } from '@services/mainwindow/store/events/duels/duels-build-deck-event';
import { DuelsExploreDecksEvent } from '@services/mainwindow/store/events/duels/duels-explore-decks-event';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { topDeckApplyFilters } from '@services/ui-store/duels-ui-helper';
import { groupByFunction, sortByProperties } from '@services/utils';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
	selector: 'duels-ooc-deck-select',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/overlays/duels-ooc/duels-ooc-deck-select.component.scss',
	],
	template: `
		<div class="container" *ngIf="decks$ | async as decks">
			<ng-container *ngIf="{ collection: collection$ | async, tempDuelsDeck: tempDuelsDeck$ | async } as value">
				<duels-deck-widget
					class="deck-container item-{{ i }}"
					[ngClass]="{ 'inactive': currentActiveDeck != null && currentActiveDeck !== i }"
					*ngFor="let deck of decks; let i = index; trackBy: trackByDeckFn"
					[deck]="deck"
					[collection]="value.collection"
					(mouseenter)="onMouseEnter(i)"
					(mouseleave)="onMouseLeave(i)"
				>
				</duels-deck-widget>
				<div class="deck-container item-3 explore-decks-widget" *ngIf="value.tempDuelsDeck">
					<div
						class="vignette"
						[ngClass]="{ 'inactive': currentActiveDeck != null }"
						(click)="exploreDecks(value.tempDuelsDeck)"
						[helpTooltip]="'duels.deck-select.explore-decks-tooltip' | owTranslate"
					>
						<div class="icon" inlineSVG="assets/svg/search.svg"></div>
					</div>
				</div>
				<div class="deck-container item-4 build-decks-widget">
					<div
						class="vignette"
						[ngClass]="{ 'inactive': currentActiveDeck != null }"
						(click)="buildDeck(value.tempDuelsDeck)"
						[helpTooltip]="'duels.deck-select.build-deck-tooltip' | owTranslate"
					>
						<div class="icon" inlineSVG="assets/svg/loot.svg"></div>
					</div>
				</div>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsOutOfCombatDeckSelectComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	decks$: Observable<readonly DuelsDeckWidgetDeck[]>;
	collection$: Observable<readonly SetCard[]>;
	tempDuelsDeck$: Observable<DuelsDeck>;

	currentActiveDeck: number;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.collection$ = this.store
			.listen$(([main, nav]) => main.binder.allSets)
			.pipe(
				this.mapData(
					([allSets]) =>
						allSets.map((set) => set.allCards).reduce((a, b) => a.concat(b), []) as readonly SetCard[],
				),
			);
		this.tempDuelsDeck$ = this.store
			.listen$(([main, nav]) => main.duels.tempDuelsDeck)
			.pipe(
				filter(
					([tempDuelsDeck]) =>
						tempDuelsDeck?.HeroCardId &&
						tempDuelsDeck?.HeroPowerCardId &&
						!!tempDuelsDeck?.Decklist?.length,
				),
				this.mapData(([tempDuelsDeck]) => tempDuelsDeck),
			);
		this.decks$ = combineLatest(
			this.store.listen$(
				([main, nav]) => main.duels.runs,
				([main, nav]) => main.duels.topDecks,
				([main, nav]) => main.duels.tempDuelsDeck,
				([main, nav]) => main.duels.currentDuelsMetaPatch,
			),
			this.store.listenPrefs$((prefs) => prefs.duelsActiveMmrFilter),
		).pipe(
			filter(
				([[runs, groupedTopDecks, tempDuelsDeck, patch], [mmrFilter]]) =>
					tempDuelsDeck?.HeroCardId && tempDuelsDeck?.HeroPowerCardId && !!tempDuelsDeck?.Decklist?.length,
			),
			this.mapData(([[runs, groupedTopDecks, tempDuelsDeck, patch], [mmrFilter]]) => {
				const { heroCardId, heroPowerCardId, signatureTreasureCardId } = this.extractPickInfos(tempDuelsDeck);
				const lastPlayedDeck: DuelsDeckWidgetDeck = this.buildLastPlayedDeck(
					runs,
					heroCardId,
					heroPowerCardId,
					signatureTreasureCardId,
				);
				const filteredTopDecks = groupedTopDecks.map((group) =>
					topDeckApplyFilters(
						group,
						mmrFilter,
						[heroCardId as CardIds],
						heroPowerCardId,
						signatureTreasureCardId,
						'last-patch',
						'all',
						patch,
						null,
						'all',
						this.allCards,
					),
				);
				const selectedTopDecks: readonly DuelsDeckWidgetDeck[] = this.buildTopDecks(
					filteredTopDecks,
					heroCardId,
					heroPowerCardId,
					signatureTreasureCardId,
					!!lastPlayedDeck ? 2 : 3,
				);
				return [lastPlayedDeck, ...selectedTopDecks].filter((deck) => !!deck);
			}),
		);
	}

	onMouseEnter(i: number) {
		this.currentActiveDeck = i;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onMouseLeave(i: number) {
		this.currentActiveDeck = undefined;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	exploreDecks(referenceDeck: DuelsDeck) {
		const { heroCardId, heroPowerCardId, signatureTreasureCardId } = this.extractPickInfos(referenceDeck);
		console.debug('explore decks', referenceDeck, heroCardId, heroPowerCardId, signatureTreasureCardId);
		this.store.send(new DuelsExploreDecksEvent(heroCardId, heroPowerCardId, signatureTreasureCardId));
	}

	buildDeck(referenceDeck: DuelsDeck) {
		const { heroCardId, heroPowerCardId, signatureTreasureCardId } = this.extractPickInfos(referenceDeck);
		console.debug('build deck', referenceDeck, heroCardId, heroPowerCardId, signatureTreasureCardId);
		this.store.send(new DuelsBuildDeckEvent(heroCardId, heroPowerCardId, signatureTreasureCardId));
	}

	private extractPickInfos(
		tempDuelsDeck: DuelsDeck,
	): {
		heroCardId: string;
		heroPowerCardId: string;
		signatureTreasureCardId: string;
	} {
		console.debug('extracting picks', tempDuelsDeck);
		const heroCardId = tempDuelsDeck.HeroCardId;
		const heroPowerCardId = tempDuelsDeck.HeroPowerCardId;
		const signatureTreasureCardId = tempDuelsDeck.Decklist.find((cardId) =>
			allDuelsSignatureTreasures.includes(cardId as CardIds),
		);
		return {
			heroCardId,
			heroPowerCardId,
			signatureTreasureCardId,
		};
	}

	private buildTopDecks(
		topDecks: readonly DuelsGroupedDecks[],
		heroCardId: string,
		heroPowerCardId: string,
		signatureTreasureCardId: string,
		numberOfDecks: number,
	): readonly DuelsDeckWidgetDeck[] {
		if (!topDecks?.length) {
			return [];
		}

		const candidates = topDecks
			.flatMap((deck) => deck.decks)
			.filter((deck) => deck.heroCardId === heroCardId)
			.filter((deck) => deck.heroPowerCardId === heroPowerCardId)
			.filter((deck) => deck.signatureTreasureCardId === signatureTreasureCardId);
		// Remove duplicates
		const groupedDecks = groupByFunction(
			(deck: DuelsDeckStat) => `${deck.decklist}-${deck.heroPowerCardId}-${deck.signatureTreasureCardId}`,
		)(candidates);
		const uniqueDecks = Object.values(groupedDecks).map(
			(decks) => [...decks].sort(sortByProperties((d: DuelsDeckStat) => [-d.rating]))[0],
		);
		const sortedCandidates = uniqueDecks.sort(
			sortByProperties((deck: DuelsDeckStat) => [deck.dustCost, -new Date(deck.runStartDate).getTime()]),
		);
		if (!sortedCandidates.length) {
			return [];
		}

		const result: readonly DuelsDeckWidgetDeck[] = sortedCandidates.slice(0, numberOfDecks).map((candidate) => ({
			id: '' + candidate.id,
			heroCardId: heroCardId,
			heroPowerCardId: heroPowerCardId,
			signatureTreasureCardId: signatureTreasureCardId,
			initialDeckList: candidate.decklist,
			finalDeckList: candidate.finalDecklist,
			mmr: candidate.rating,
			type: 'paid-duels',
			wins: candidate.wins,
			losses: candidate.losses,
			treasureCardIds: candidate.treasuresCardIds.filter((cardId) => isPassive(cardId, this.allCards)),
			isLastPersonalDeck: false,
			dustCost: candidate.dustCost,
		}));
		// console.debug('result', result);
		return result;
	}

	private buildLastPlayedDeck(
		runs: readonly DuelsRun[],
		heroCardId: string,
		heroPowerCardId: string,
		signatureTreasureCardId: string,
	): DuelsDeckWidgetDeck {
		if (!runs?.length) {
			return null;
		}

		const runsWithSteps = runs.filter((run) => run.heroCardId === heroCardId).filter((run) => !!run.steps?.length);
		let validRuns = runsWithSteps
			.filter((run) => run.heroPowerCardId === heroPowerCardId)
			.filter((run) => run.signatureTreasureCardId === signatureTreasureCardId)
			.sort((a, b) => b.creationTimestamp - a.creationTimestamp);
		if (!validRuns.length) {
			validRuns = runsWithSteps
				.filter((run) => !run.heroPowerCardId || run.heroPowerCardId === heroPowerCardId)
				.filter(
					(run) => !run.signatureTreasureCardId || run.signatureTreasureCardId === signatureTreasureCardId,
				)
				.sort((a, b) => b.creationTimestamp - a.creationTimestamp);
		}
		console.debug('replaysWithCorrectDeckAndOptions', validRuns);
		const candidate = validRuns[0];
		if (!candidate) {
			return null;
		}

		const runReplays = candidate.steps
			.filter((step) => (step as GameStat)?.buildNumber)
			.map((step) => step as GameStat)
			.sort((a, b) => b.creationTimestamp - a.creationTimestamp);

		const treasureCardIds = candidate.steps
			.filter((step) => (step as DuelsRunInfo)?.bundleType === 'treasure')
			.map((step) => step as DuelsRunInfo)
			.sort((a, b) => a.creationTimestamp - b.creationTimestamp)
			.map((options) => options[`option${options.chosenOptionIndex}`])
			.filter((cardId) => isPassive(cardId, this.allCards));
		return {
			id: '' + candidate.creationTimestamp,
			heroCardId: heroCardId,
			heroPowerCardId: heroPowerCardId,
			signatureTreasureCardId: signatureTreasureCardId,
			initialDeckList: candidate.initialDeckList,
			finalDeckList: runReplays[runReplays.length - 1].playerDecklist,
			mmr: candidate.ratingAtStart,
			type: candidate.type,
			wins: candidate.wins,
			losses: candidate.losses,
			treasureCardIds: treasureCardIds,
			isLastPersonalDeck: true,
			dustCost: 0,
		};
	}

	trackByDeckFn(index: number, item: DuelsDeckWidgetDeck) {
		return item.id;
	}
}
