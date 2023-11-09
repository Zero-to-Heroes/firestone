import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { DuelsDeckWidgetDeck } from '@components/overlays/duels-ooc/duels-deck-widget-deck';
import { CardIds, isPassive } from '@firestone-hs/reference-data';
import { DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { DuelsTimeFilterType } from '@firestone/duels/data-access';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { DuelsDeckStat } from '@models/duels/duels-player-stats';
import { DuelsRun } from '@models/duels/duels-run';
import { SetCard } from '@models/set';
import { DuelsBuildDeckEvent } from '@services/mainwindow/store/events/duels/duels-build-deck-event';
import { DuelsExploreDecksEvent } from '@services/mainwindow/store/events/duels/duels-explore-decks-event';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import { getDuelsMmrFilterNumber, topDeckApplyFilters } from '@services/ui-store/duels-ui-helper';
import { deepEqual, groupByFunction, sortByProperties } from '@services/utils';
import { Observable, combineLatest, debounceTime, distinctUntilChanged, shareReplay, tap } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DuelsTopDeckService } from '../../../services/duels/duels-top-decks.service';
import { PatchesConfigService } from '../../../services/patches-config.service';

@Component({
	selector: 'duels-ooc-deck-select',
	styleUrls: ['../../../../css/component/overlays/duels-ooc/duels-ooc-deck-select.component.scss'],
	template: `
		<ng-container *ngIf="{ collection: collection$ | async, heroLoadout: heroLoadout$ | async } as value">
			<div class="container" *ngIf="value.heroLoadout">
				<div class="deck-container explore-decks-widget">
					<div
						class="vignette"
						[ngClass]="{ inactive: currentActiveDeck != null }"
						(click)="exploreDecks(value.heroLoadout)"
						[helpTooltip]="'duels.deck-select.explore-decks-tooltip' | owTranslate"
					>
						<div class="icon" inlineSVG="assets/svg/search.svg"></div>
					</div>
				</div>
				<div class="deck-container build-decks-widget">
					<div
						class="vignette"
						[ngClass]="{ inactive: currentActiveDeck != null }"
						(click)="buildDeck(value.heroLoadout)"
						[helpTooltip]="'duels.deck-select.build-deck-tooltip' | owTranslate"
					>
						<div class="icon" inlineSVG="assets/svg/loot.svg"></div>
					</div>
				</div>
				<ng-container>
					<duels-deck-widget
						class="deck-container "
						[ngClass]="{ inactive: currentActiveDeck != null && currentActiveDeck !== i }"
						*ngFor="let deck of decks$ | async; let i = index; trackBy: trackByDeckFn"
						[deck]="deck"
						[collection]="value.collection"
						(mouseenter)="onMouseEnter(i)"
						(mouseleave)="onMouseLeave(i)"
					>
					</duels-deck-widget>
				</ng-container>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsOutOfCombatDeckSelectComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	decks$: Observable<readonly DuelsDeckWidgetDeck[]>;
	collection$: Observable<readonly SetCard[]>;
	heroLoadout$: Observable<HeroLoadout>;

	currentActiveDeck: number;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly duelsTopDecks: DuelsTopDeckService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.patchesConfig.isReady();
		await this.duelsTopDecks.isReady();

		this.collection$ = this.store.sets$().pipe(
			this.mapData(
				(allSets) => allSets.map((set) => set.allCards).reduce((a, b) => a.concat(b), []) as readonly SetCard[],
			),
			shareReplay(1),
			this.mapData((info) => info),
		);

		this.heroLoadout$ = combineLatest([
			this.store.listen$(
				([state]) => state.duels?.heroOptions,
				([state]) => state.duels?.heroPowerOptions,
				([state]) => state.duels?.signatureTreasureOptions,
			),
		]).pipe(
			debounceTime(200),
			distinctUntilChanged((a, b) => {
				return deepEqual(a, b);
			}),
			this.mapData(([[heroOptions, heroPowerOptions, signatureTreasureOptions]]) => {
				const selectedHero = heroOptions?.find((option) => option.Selected);
				const selectedHeroPower = heroPowerOptions?.find((option) => option.Selected);
				const selectedSignatureTreasure = signatureTreasureOptions?.find((option) => option.Selected);
				return {
					heroCardId: this.allCards.getCard(selectedHero?.DatabaseId).id,
					heroPowerCardId: this.allCards.getCard(selectedHeroPower?.DatabaseId).id,
					signatureTreasureCardId: this.allCards.getCard(selectedSignatureTreasure?.DatabaseId).id,
				};
			}),
			shareReplay(1),
			tap((info) => console.debug('[duels-ooc-deck-select] hero loadout', info)),
			this.mapData((info) => info),
		);

		const mmrFilter$ = combineLatest([
			this.store.duelsMetaStats$(),
			this.store.listen$(([main, nav, prefs]) => prefs.duelsActiveMmrFilter),
		]).pipe(
			this.mapData(([duelsMetaStats, [mmrFilter]]) => {
				const mmrPercentiles = duelsMetaStats?.mmrPercentiles;
				const trueMmrFilter = getDuelsMmrFilterNumber(mmrPercentiles, mmrFilter);
				return trueMmrFilter;
			}),
			shareReplay(1),
			this.mapData((info) => info),
		);

		// this.tempDuelsDeck$ = this.store
		// 	.listen$(([main, nav]) => main.duels.tempDuelsDeck)
		// 	.pipe(
		// 		tap((info) => console.debug('[duels-ooc-deck-select] tempDuelsDeck 0', info)),
		// 		filter(
		// 			([tempDuelsDeck]) =>
		// 				tempDuelsDeck?.HeroCardId &&
		// 				tempDuelsDeck?.HeroPowerCardId &&
		// 				!!tempDuelsDeck?.DeckList?.length,
		// 		),
		// 		tap((info) => console.debug('[duels-ooc-deck-select] tempDuelsDeck', info)),
		// 		this.mapData(([tempDuelsDeck]) => tempDuelsDeck),
		// 	);

		const topDecks$ = combineLatest([
			this.duelsTopDecks.topDeck$$,
			this.heroLoadout$,
			this.patchesConfig.currentDuelsMetaPatch$$,
			mmrFilter$,
		]).pipe(
			filter(
				([topDecks, heroLoadout, patch]) =>
					heroLoadout?.heroCardId && heroLoadout?.heroPowerCardId && !!topDecks?.length,
			),
			this.mapData(([allTopDecks, heroLoadout, patch, mmrFilter]) => {
				let period: DuelsTimeFilterType = 'last-patch';
				const allDecks = allTopDecks?.flatMap((group) => group.decks);
				let topDecks = topDeckApplyFilters(
					allDecks,
					mmrFilter,
					[heroLoadout.heroCardId as CardIds],
					[heroLoadout.heroPowerCardId],
					[heroLoadout.signatureTreasureCardId],
					period,
					'all',
					null,
					patch,
				);
				console.debug('top tops', period, heroLoadout, topDecks);
				if (topDecks.length < 3) {
					period = 'past-seven';
					(topDecks = topDeckApplyFilters(
						allDecks,
						mmrFilter,
						[heroLoadout.heroCardId as CardIds],
						[heroLoadout.heroPowerCardId],
						[heroLoadout.signatureTreasureCardId],
						period,
						'all',
						null,
						patch,
					)),
						console.debug('top tops', period, topDecks);
				}
				return topDecks;
			}),
		);

		this.decks$ = combineLatest([this.store.duelsRuns$(), topDecks$, this.heroLoadout$]).pipe(
			filter(([runs, topDecks, heroLoadout]) => !!heroLoadout?.heroCardId && !!heroLoadout?.heroPowerCardId),
			this.mapData(([runs, topDecks, heroLoadout]) => {
				const { heroCardId, heroPowerCardId, signatureTreasureCardId } = heroLoadout;
				const lastPlayedDeck: DuelsDeckWidgetDeck = this.buildLastPlayedDeck(
					runs,
					heroCardId,
					heroPowerCardId,
					signatureTreasureCardId,
				);
				const selectedTopDecks: readonly DuelsDeckWidgetDeck[] = this.buildTopDecks(
					topDecks,
					heroCardId,
					heroPowerCardId,
					signatureTreasureCardId,
					!!lastPlayedDeck ? 2 : 3,
				);
				return [lastPlayedDeck, ...selectedTopDecks];
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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

	exploreDecks(heroLoadout: HeroLoadout) {
		const { heroCardId, heroPowerCardId, signatureTreasureCardId } = heroLoadout;
		this.store.send(new DuelsExploreDecksEvent(heroCardId, heroPowerCardId, signatureTreasureCardId));
	}

	buildDeck(heroLoadout: HeroLoadout) {
		const { heroCardId, heroPowerCardId, signatureTreasureCardId } = heroLoadout;
		this.store.send(new DuelsBuildDeckEvent(heroCardId, heroPowerCardId, signatureTreasureCardId));
	}

	private buildTopDecks(
		topDecks: readonly DuelsDeckStat[],
		heroCardId: string,
		heroPowerCardId: string,
		signatureTreasureCardId: string,
		numberOfDecks: number,
	): readonly DuelsDeckWidgetDeck[] {
		const candidates =
			topDecks
				?.filter((deck) => deck.heroCardId === heroCardId)
				.filter((deck) => deck.heroPowerCardId === heroPowerCardId)
				.filter((deck) => deck.signatureTreasureCardId === signatureTreasureCardId) ?? [];
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

		const finalTopDecks: readonly DuelsDeckWidgetDeck[] = sortedCandidates
			.slice(0, numberOfDecks)
			.map((candidate) => ({
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
		const result: DuelsDeckWidgetDeck[] = [...finalTopDecks];
		for (let i = result.length; i < numberOfDecks; i++) {
			result.push({
				id: `top-deck-${i}`,
				isLastPersonalDeck: false,
			} as DuelsDeckWidgetDeck);
		}
		return result;
	}

	private buildLastPlayedDeck(
		runs: readonly DuelsRun[],
		heroCardId: string,
		heroPowerCardId: string,
		signatureTreasureCardId: string,
	): DuelsDeckWidgetDeck {
		const runsWithSteps =
			runs?.filter((run) => run.heroCardId === heroCardId).filter((run) => !!run.steps?.length) ?? [];
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
		const candidate = validRuns[0];
		if (!candidate) {
			return {
				id: 'personal-deck',
				isLastPersonalDeck: true,
			} as DuelsDeckWidgetDeck;
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

interface HeroLoadout {
	heroCardId: string;
	heroPowerCardId: string;
	signatureTreasureCardId: string;
}
