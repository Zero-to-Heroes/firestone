import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { DuelsHeroInfo, DuelsHeroInfoTopDeck } from '@components/overlays/duels-ooc/duels-hero-info';
import { CardIds, ReferenceCard, allDuelsHeroes, normalizeDuelsHeroCardId } from '@firestone-hs/reference-data';
import { DuelsTimeFilterType, filterDuelsHeroStats } from '@firestone/duels/data-access';
import { sortByProperties, uuidShort } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { PatchInfo } from '@legacy-import/src/lib/js/models/patches';
import { DuelsTimeFilterSelectedEvent } from '@legacy-import/src/lib/js/services/mainwindow/store/events/duels/duels-time-filter-selected-event';
import { DuelsDeckStat, DuelsHeroPlayerStat } from '@models/duels/duels-player-stats';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import {
	buildDuelsHeroPlayerStats,
	filterDuelsRuns,
	getDuelsMmrFilterNumber,
	topDeckApplyFilters,
} from '@services/ui-store/duels-ui-helper';
import { groupByFunction } from '@services/utils';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DuelsGroupedDecks } from '../../../models/duels/duels-grouped-decks';
import { DuelsTopDeckService } from '../../../services/duels/duels-top-decks.service';
import { PatchesConfigService } from '../../../services/patches-config.service';

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
			[timeFrame]="timeFrame$ | async"
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
	timeFrame$: Observable<DuelsTimeFilterType>;

	private selectedHeroCardId = new BehaviorSubject<string>(null);

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

		// Make sure the data for the last patch is available
		this.store.send(new DuelsTimeFilterSelectedEvent('last-patch'));

		this.patch$ = this.patchesConfig.currentDuelsMetaPatch$$.pipe(this.mapData((info) => info));
		this.heroes$ = this.store
			.listen$(([state, prefs]) => state?.duels?.heroOptionsDbfIds)
			.pipe(
				filter(([heroDbfIds]) => !!heroDbfIds?.length),
				this.mapData(([heroDbfIds]) => heroDbfIds.map((dbfId) => this.allCards.getCardFromDbfId(dbfId))),
			);
		const allHeroCardIds$ = this.heroes$.pipe(this.mapData((heroes) => heroes.map((hero) => hero.id)));

		const playerRuns$ = combineLatest([
			allHeroCardIds$,
			this.store.duelsRuns$(),
			this.patchesConfig.currentDuelsMetaPatch$$,
		]).pipe(
			this.mapData(([allHeroCards, runs, patch]) => {
				const duelsRuns = filterDuelsRuns(
					runs,
					'last-patch',
					allDuelsHeroes,
					'all',
					null,
					patch,
					0,
					[],
					[],
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

		const mmrFilter$ = combineLatest([
			this.store.duelsMetaStats$(),
			this.store.listen$(([main, nav, prefs]) => prefs.duelsActiveMmrFilter),
		]).pipe(
			this.mapData(([duelsMetaStats, [mmrFilter]]) => {
				const mmrPercentiles = duelsMetaStats?.mmrPercentiles;
				const trueMmrFilter = getDuelsMmrFilterNumber(mmrPercentiles, mmrFilter);
				return trueMmrFilter;
			}),
		);

		const topDecks$ = combineLatest([
			this.duelsTopDecks.topDeck$$,
			allHeroCardIds$,
			mmrFilter$,
			this.patchesConfig.currentDuelsMetaPatch$$,
		]).pipe(
			this.mapData(([duelsTopDecks, allHeroCardIds, mmrFilter, patch]) => {
				let period: DuelsTimeFilterType = 'last-patch';
				let topDeckStatsForHeroes = this.buildTopDeckStatsForHeroes(
					allHeroCardIds,
					duelsTopDecks,
					mmrFilter,
					allDuelsHeroes,
					period,
					patch,
				);
				console.debug('top decks for last patch', topDeckStatsForHeroes);
				if (topDeckStatsForHeroes.some((stat) => stat.topDecks.length === 0)) {
					period = 'past-seven';
					topDeckStatsForHeroes = this.buildTopDeckStatsForHeroes(
						allHeroCardIds,
						duelsTopDecks,
						mmrFilter,
						allDuelsHeroes,
						period,
						patch,
					);
					console.debug('top decks for past seven', topDeckStatsForHeroes);
				}
				console.debug('built top deck stats', topDeckStatsForHeroes);
				return { decks: topDeckStatsForHeroes, period: period };
			}),
		);
		this.timeFrame$ = topDecks$.pipe(this.mapData((topDecks) => topDecks.period));

		const metaHeroStats$ = combineLatest([this.store.duelsMetaStats$(), allHeroCardIds$, playerRuns$]).pipe(
			this.mapData(([duelsMetaStats, allHeroCardIds, playerRuns]) => {
				// Build stats like winrate
				const duelsHeroStats = filterDuelsHeroStats(
					duelsMetaStats?.heroes,
					allHeroCardIds as CardIds[],
					null,
					null,
					'hero',
					this.allCards,
					null,
				)
					.filter((stat) =>
						allHeroCardIds.some(
							(heroCardId) =>
								normalizeDuelsHeroCardId(stat.hero) === normalizeDuelsHeroCardId(heroCardId),
						),
					)
					.filter((stat) => stat.date === 'last-patch');
				const enrichedStats: readonly DuelsHeroPlayerStat[] = buildDuelsHeroPlayerStats(
					duelsHeroStats,
					'hero',
					playerRuns,
				);
				return enrichedStats;
			}),
		);

		this.heroInfo$ = combineLatest([this.selectedHeroCardId.asObservable(), metaHeroStats$, topDecks$]).pipe(
			this.mapData(([currentHeroCardId, duelsMetaStats, topDecks]) => {
				if (!currentHeroCardId || !topDecks?.decks?.length) {
					return null;
				}

				// The top decks
				const topDecksForHero = topDecks.decks.find(
					(d) => normalizeDuelsHeroCardId(d.cardId) === normalizeDuelsHeroCardId(currentHeroCardId),
				)?.topDecks;
				const metaStatsForHero = duelsMetaStats.find(
					(s) => normalizeDuelsHeroCardId(s.cardId) === normalizeDuelsHeroCardId(currentHeroCardId),
				);
				const result = this.buildDuelsHeroFullStat(currentHeroCardId, metaStatsForHero, topDecksForHero);
				return result?.stat;
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildTopDeckStatsForHeroes(
		allHeroCardIds: string[],
		duelsTopDecks: readonly DuelsGroupedDecks[],
		trueMmrFilter: number,
		allDuelsHeroes: CardIds[],
		timeFilter: DuelsTimeFilterType,
		patch: PatchInfo,
	) {
		const topDecks = this.buildTopDecks(
			allHeroCardIds,
			duelsTopDecks,
			trueMmrFilter,
			allDuelsHeroes,
			timeFilter,
			patch,
		);
		const topDeckStatsForHeroes = allHeroCardIds.map((cardId) => {
			const topDecksForHero = topDecks
				.filter((deck) => normalizeDuelsHeroCardId(deck.heroCardId) === normalizeDuelsHeroCardId(cardId))
				.sort(sortByProperties((a: DuelsDeckStat) => [a.dustCost, a.wins]));
			return {
				cardId: cardId,
				topDecks: topDecksForHero,
			};
		});
		return topDeckStatsForHeroes;
	}

	private buildTopDecks(
		allHeroCards: readonly string[],
		duelsTopDecks: readonly DuelsGroupedDecks[],
		trueMmrFilter: number,
		allDuelsHeroes: CardIds[],
		timeFilter: DuelsTimeFilterType,
		patch: PatchInfo,
	) {
		return (duelsTopDecks ?? [])
			.map((deck) =>
				topDeckApplyFilters(deck, trueMmrFilter, allDuelsHeroes, [], [], timeFilter, null, null, patch),
			)
			.filter((group) => group.decks.length > 0)
			.flatMap((group) => group.decks)
			.filter((deck) =>
				allHeroCards.some(
					(heroCardId) => normalizeDuelsHeroCardId(deck.heroCardId) === normalizeDuelsHeroCardId(heroCardId),
				),
			);
	}

	private buildDuelsHeroFullStat(
		cardId: string,
		stat: DuelsHeroPlayerStat,
		topDecksForHero: readonly DuelsDeckStat[],
	): {
		cardId: string;
		stat: DuelsHeroInfo;
	} {
		console.debug('handling hero', this.allCards.getCard(cardId).name, cardId, stat);
		if (!stat) {
			return this.buildEmptyStat(cardId);
		}

		const heroDecks = [...topDecksForHero]
			.sort((a, b) => new Date(b.runStartDate).getTime() - new Date(a.runStartDate).getTime())
			.map((deck) => {
				const result: DuelsHeroInfoTopDeck = {
					deckId: uuidShort(),
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
