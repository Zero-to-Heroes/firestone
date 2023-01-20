import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { DuelsHeroInfo, DuelsHeroInfoTopDeck } from '@components/overlays/duels-ooc/duels-hero-info';
import { allDuelsHeroes, CardIds, normalizeDuelsHeroCardId, ReferenceCard } from '@firestone-hs/reference-data';
import { PatchInfo } from '@legacy-import/src/lib/js/models/patches';
import { DuelsTimeFilterSelectedEvent } from '@legacy-import/src/lib/js/services/mainwindow/store/events/duels/duels-time-filter-selected-event';
import { DuelsDeckStat, DuelsHeroPlayerStat } from '@models/duels/duels-player-stats';
import { CardsFacadeService } from '@services/cards-facade.service';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import {
	buildDuelsHeroPlayerStats,
	filterDuelsHeroStats,
	filterDuelsRuns,
	getDuelsMmrFilterNumber,
	mergeDuelsHeroPlayerStats,
	topDeckApplyFilters,
} from '@services/ui-store/duels-ui-helper';
import { groupByFunction, uuid } from '@services/utils';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
	selector: 'duels-ooc-hero-selection',
	styleUrls: ['../../../../css/component/overlays/duels-ooc/duels-ooc-hero-selection.component.scss'],
	template: `
		<div class="container" *ngIf="heroes$ | async as heroes">
			<div class="cell" *ngFor="let hero of heroes; trackBy: trackByFn">
				<div
					class="empty-card"
					(mouseenter)="onMouseEnter(hero.id)"
					(mouseleave)="onMouseLeave(hero.id, $event)"
				></div>
			</div>
		</div>
		<duels-hero-info
			*ngIf="heroInfo$ | async as heroInfo"
			[heroInfo]="heroInfo"
			[patch]="patch$ | async"
		></duels-hero-info>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsOutOfCombatHeroSelectionComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	heroes$: Observable<readonly ReferenceCard[]>;
	heroInfo$: Observable<DuelsHeroInfo>;
	patch$: Observable<PatchInfo>;

	private selectedHeroCardId = new BehaviorSubject<string>(null);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		// Make sure the data for the last patch is available
		this.store.send(new DuelsTimeFilterSelectedEvent('last-patch'));

		this.patch$ = this.store
			.listen$(([state]) => state.duels?.currentDuelsMetaPatch)
			.pipe(this.mapData(([info]) => info));

		this.heroes$ = this.store
			.listen$(([state, prefs]) => state?.duels?.heroOptionsDbfIds)
			.pipe(
				filter(([heroDbfIds]) => !!heroDbfIds?.length),
				this.mapData(([heroDbfIds]) => heroDbfIds.map((dbfId) => this.allCards.getCardFromDbfId(dbfId))),
			);
		const allHeroCardIds$ = this.heroes$.pipe(this.mapData((heroes) => heroes.map((hero) => hero.id)));

		const topDecks$ = combineLatest([
			allHeroCardIds$,
			this.store.listen$(
				([main, nav]) => main.duels.topDecks,
				([main, nav]) => main.duels.globalStats?.mmrPercentiles,
				([main, nav, prefs]) => prefs.duelsActiveMmrFilter,
				([main, nav, prefs]) => prefs.duelsActiveTopDecksDustFilter,
				([main, nav, prefs]) => main.duels.currentDuelsMetaPatch,
			),
		]).pipe(
			this.mapData(([allHeroCards, [duelsTopDecks, mmrPercentiles, mmrFilter, dustFilter, patch]]) => {
				const trueMmrFilter = getDuelsMmrFilterNumber(mmrPercentiles, mmrFilter);
				const topDecks = duelsTopDecks
					.map((deck) =>
						topDeckApplyFilters(
							deck,
							trueMmrFilter,
							allDuelsHeroes,
							'all',
							'all',
							'last-patch',
							dustFilter,
							null,
							patch,
						),
					)
					.filter((group) => group.decks.length > 0)
					.flatMap((group) => group.decks)
					.filter((deck) =>
						allHeroCards.some(
							(heroCardId) =>
								normalizeDuelsHeroCardId(deck.heroCardId) === normalizeDuelsHeroCardId(heroCardId),
						),
					);
				return topDecks;
			}),
		);

		const duelsHeroStats$ = combineLatest([
			allHeroCardIds$,
			this.store.listen$(([main, nav]) => main.duels.globalStats?.heroes),
		]).pipe(
			this.mapData(([allHeroCards, [duelStats]]) => {
				const duelsHeroStats = filterDuelsHeroStats(
					duelStats,
					allHeroCards as CardIds[],
					null,
					null,
					'hero',
					this.allCards,
					null,
				);
				console.debug('duelsHeroStats', duelsHeroStats, duelStats);
				return duelsHeroStats.filter((stat) =>
					allHeroCards.some(
						(heroCardId) => normalizeDuelsHeroCardId(stat.hero) === normalizeDuelsHeroCardId(heroCardId),
					),
				);
			}),
		);

		const playerRuns$ = combineLatest([
			allHeroCardIds$,
			this.store.duelsRuns$(),
			this.store.listen$(([main, nav]) => main.duels.currentDuelsMetaPatch),
		]).pipe(
			this.mapData(([allHeroCards, runs, [patch]]) => {
				const duelsRuns = filterDuelsRuns(
					runs,
					'last-patch',
					allDuelsHeroes,
					'all',
					null,
					patch,
					0,
					'all',
					'all',
					'hero',
				);
				return duelsRuns.filter((run) =>
					allHeroCards.some(
						(heroCardId) =>
							normalizeDuelsHeroCardId(run.heroCardId) === normalizeDuelsHeroCardId(heroCardId),
					),
				);
			}),
		);

		const duelsHeroFullStats$ = combineLatest([allHeroCardIds$, topDecks$, duelsHeroStats$, playerRuns$]).pipe(
			this.mapData(([allHeroCardIds, topDecks, duelsHeroStats, playerRuns]) => {
				const enrichedStats = buildDuelsHeroPlayerStats(duelsHeroStats, 'hero', playerRuns);
				return allHeroCardIds.map((cardId) => {
					const enrichedStatsForHero = enrichedStats.filter(
						(s) => normalizeDuelsHeroCardId(s.cardId) === normalizeDuelsHeroCardId(cardId),
					);
					const topDecksForHero = topDecks.filter(
						(deck) => normalizeDuelsHeroCardId(deck.heroCardId) === normalizeDuelsHeroCardId(cardId),
					);
					return this.buildDuelsHeroFullStat(cardId, enrichedStatsForHero, topDecksForHero);
				});
			}),
		);

		this.heroInfo$ = combineLatest([this.selectedHeroCardId.asObservable(), duelsHeroFullStats$]).pipe(
			this.mapData(
				([currentHeroCardId, allStats]) =>
					allStats.find(
						(stat) =>
							normalizeDuelsHeroCardId(stat?.cardId) === normalizeDuelsHeroCardId(currentHeroCardId),
					)?.stat,
			),
		);
	}

	private buildDuelsHeroFullStat(
		cardId: string,
		enrichedStatsForHero: readonly DuelsHeroPlayerStat[],
		topDecksForHero: readonly DuelsDeckStat[],
	): {
		cardId: string;
		stat: DuelsHeroInfo;
	} {
		const stat: DuelsHeroPlayerStat = mergeDuelsHeroPlayerStats(enrichedStatsForHero, cardId);
		console.debug('handling hero', this.allCards.getCard(cardId).name, cardId, stat);
		if (!stat) {
			return this.buildEmptyStat(cardId);
		}

		const heroDecks = [...topDecksForHero]
			.sort((a, b) => new Date(b.runStartDate).getTime() - new Date(a.runStartDate).getTime())
			.map((deck) => {
				const result: DuelsHeroInfoTopDeck = {
					deckId: uuid(),
					decklist: deck.decklist,
					heroCardId: deck.heroCardId,
					heroPowerCardId: deck.heroPowerCardId,
					signatureTreasureCardId: deck.signatureTreasureCardId,
					wins: deck.wins,
					losses: deck.losses,
					treasureCardIds: deck.treasuresCardIds,
					dust: deck.dustCost,
				};
				return result;
			});
		// Remove duplicate decklists
		const groupedDecks = groupByFunction(
			(deck: DuelsHeroInfoTopDeck) => `${deck.decklist}-${deck.heroPowerCardId}-${deck.signatureTreasureCardId}`,
		)(heroDecks);
		const uniqueDecks = Object.values(groupedDecks).map((decks) => decks[0]);

		const card = this.allCards.getCard(cardId);
		const result: DuelsHeroInfo = {
			cardId: cardId,
			name: card.name,
			globalTotalMatches: stat.globalTotalMatches,
			globalWinrate: stat.globalWinrate,
			playerWinrate: stat.playerWinrate,
			globalPopularity: stat.globalPopularity,
			playerMatches: stat.playerTotalMatches,
			globalWinDistribution: stat.globalWinDistribution,
			topDecks: uniqueDecks,
		};
		return {
			cardId: cardId,
			stat: result,
		};
	}

	private buildEmptyStat(cardId: string): { cardId: string; stat: DuelsHeroInfo } {
		console.warn('missing stat', cardId);
		const emptyWinDistribution: readonly { winNumber: number; value: number }[] = [...Array(13).keys()].map(
			(value, index) => ({
				winNumber: index,
				value: 0,
			}),
		);
		const card = this.allCards.getCard(cardId);
		const result: DuelsHeroInfo = {
			cardId: cardId,
			name: card.name,
			globalTotalMatches: 0,
			globalWinrate: undefined,
			playerWinrate: undefined,
			globalPopularity: undefined,
			playerMatches: 0,
			globalWinDistribution: emptyWinDistribution,
			topDecks: [],
		};
		return {
			cardId: cardId,
			stat: result,
		};
	}

	async onMouseEnter(cardId: string) {
		// this.selectedHeroCardId.next(null);
		// await sleep(100);
		this.selectedHeroCardId.next(cardId);
	}

	onMouseLeave(cardId: string, event: MouseEvent) {
		if (!event.shiftKey) {
			this.selectedHeroCardId.next(null);
		}
	}

	trackByFn(index: number, item: ReferenceCard) {
		return item.id;
	}
}
