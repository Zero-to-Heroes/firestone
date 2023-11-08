import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { DuelsHeroInfo, DuelsHeroInfoTopDeck } from '@components/overlays/duels-ooc/duels-hero-info';
import { CardIds, ReferenceCard, normalizeDuelsHeroCardId } from '@firestone-hs/reference-data';
import { DuelsStatTypeFilterType, DuelsTimeFilterType, filterDuelsHeroStats } from '@firestone/duels/data-access';
import { groupByFunction, sortByProperties, uuidShort } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { PatchInfo } from '@legacy-import/src/lib/js/models/patches';
import { DuelsDeckStat, DuelsHeroPlayerStat } from '@models/duels/duels-player-stats';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import {
	buildDuelsHeroPlayerStats,
	filterDuelsRuns,
	getDuelsMmrFilterNumber,
	topDeckApplyFilters,
} from '@services/ui-store/duels-ui-helper';
import { deepEqual } from '@services/utils';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, tap } from 'rxjs/operators';
import { DuelsGroupedDecks } from '../../../models/duels/duels-grouped-decks';
import { DuelsTopDeckService } from '../../../services/duels/duels-top-decks.service';
import { PatchesConfigService } from '../../../services/patches-config.service';

@Component({
	selector: 'duels-ooc-hero-selection',
	styleUrls: ['../../../../css/component/overlays/duels-ooc/duels-ooc-hero-selection.component.scss'],
	template: `
		<div class="container" *ngIf="optionCards$ | async as heroes">
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
	optionCards$: Observable<readonly ReferenceCard[]>;
	heroInfo$: Observable<DuelsHeroInfo>;
	patch$: Observable<PatchInfo>;
	timeFrame$: Observable<DuelsTimeFilterType>;

	private selectedOptionCardId = new BehaviorSubject<string>(null);

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

		const heroLoadout$ = combineLatest([
			this.store.listen$(
				([state]) => state.duels?.heroOptions,
				([state]) => state.duels?.heroPowerOptions,
				([state]) => state.duels?.signatureTreasureOptions,
			),
		]).pipe(
			tap((info) => console.debug('[duels-ooc-hero-selection] building loadout', info)),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			this.mapData(([[heroOptions, heroPowerOptions, signatureTreasureOptions]]) => {
				const selectedHero = heroOptions?.find((option) => option.Selected);
				const selectedHeroPower = heroPowerOptions?.find((option) => option.Selected);
				const selectedSignatureTreasure = signatureTreasureOptions?.find((option) => option.Selected);
				return {
					heroCardId: selectedHero?.DatabaseId,
					heroPowerCardId: selectedHeroPower?.DatabaseId,
					signatureTreasureCardId: selectedSignatureTreasure?.DatabaseId,
				};
			}),
			tap((loadout) => console.debug('[duels-ooc-hero-selection] loadout', loadout)),
		);

		this.patch$ = this.patchesConfig.currentDuelsMetaPatch$$.pipe(this.mapData((info) => info));
		this.optionCards$ = combineLatest([heroLoadout$, this.store.listen$(([state, prefs]) => state.duels)]).pipe(
			this.mapData(([heroLoadout, [state]]) => {
				const stage: DuelsStatTypeFilterType = !heroLoadout.heroCardId
					? 'hero'
					: !heroLoadout.heroPowerCardId
					? 'hero-power'
					: 'signature-treasure';
				const options =
					stage === 'hero'
						? state.heroOptions
						: stage === 'hero-power'
						? state.heroPowerOptions
						: state.signatureTreasureOptions;
				return options?.map((option) => this.allCards.getCard(option.DatabaseId));
			}),
		);
		const optionCardIds$ = this.optionCards$.pipe(this.mapData((options) => options.map((option) => option.id)));

		const stage$ = heroLoadout$.pipe(
			this.mapData((heroLoadout) =>
				!heroLoadout.heroCardId ? 'hero' : !heroLoadout.heroPowerCardId ? 'hero-power' : 'signature-treasure',
			),
		);
		const validOptions$ = combineLatest([optionCardIds$, stage$, heroLoadout$]).pipe(
			tap((info) => console.debug('[duels-ooc-hero-selection] stage', info)),
			this.mapData(([optionCardIds, stage, heroLoadout]) => {
				const validHeroes: string[] = (stage === 'hero' ? optionCardIds : [heroLoadout.heroCardId])
					.map((id) => normalizeDuelsHeroCardId(this.allCards.getCard(id).id))
					.filter((id) => !!id);
				const validHeroPowers: string[] = (
					stage === 'hero-power' ? optionCardIds : [heroLoadout.heroPowerCardId]
				)
					.map((id) => this.allCards.getCard(id).id)
					.filter((id) => !!id);
				const validSignatureTreasures: string[] = (
					stage === 'signature-treasure' ? optionCardIds : [heroLoadout.signatureTreasureCardId]
				)
					.map((id) => this.allCards.getCard(id).id)
					.filter((id) => !!id);
				return {
					validHeroes,
					validHeroPowers,
					validSignatureTreasures,
				};
			}),
		);

		const playerRuns$ = combineLatest([
			optionCardIds$,
			validOptions$,
			this.store.duelsRuns$(),
			this.patchesConfig.currentDuelsMetaPatch$$,
		]).pipe(
			filter(([optionCardIds, validOptions, runs, patch]) => !!validOptions),
			this.mapData(([optionCardIds, validOptions, runs, patch]) => {
				const duelsRuns = filterDuelsRuns(
					runs,
					'last-patch',
					validOptions.validHeroes as CardIds[],
					'all',
					null,
					patch,
					0,
					validOptions.validHeroPowers as CardIds[],
					validOptions.validSignatureTreasures as CardIds[],
				);
				return duelsRuns;
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
			validOptions$,
			mmrFilter$,
			stage$,
			this.patchesConfig.currentDuelsMetaPatch$$,
		]).pipe(
			this.mapData(([duelsTopDecks, validOptions, mmrFilter, stage, patch]) => {
				let period: DuelsTimeFilterType = 'last-patch';
				let topDeckStatsForHeroes = buildTopDeckStatsForHeroes(
					validOptions.validHeroes,
					validOptions.validHeroPowers,
					validOptions.validSignatureTreasures,
					duelsTopDecks,
					mmrFilter,
					period,
					patch,
					stage,
				);
				console.debug(
					'top decks for last patch',
					topDeckStatsForHeroes,
					buildTopDeckStatsForHeroes(
						validOptions.validHeroes,
						[],
						[],
						duelsTopDecks,
						mmrFilter,
						period,
						patch,
						stage,
					),
				);
				if (!topDeckStatsForHeroes.length || topDeckStatsForHeroes.some((stat) => stat.topDecks.length === 0)) {
					period = 'past-seven';
					topDeckStatsForHeroes = buildTopDeckStatsForHeroes(
						validOptions.validHeroes,
						validOptions.validHeroPowers,
						validOptions.validSignatureTreasures,
						duelsTopDecks,
						mmrFilter,
						period,
						patch,
						stage,
					);
					console.debug(
						'top decks for past seven',
						topDeckStatsForHeroes,
						buildTopDeckStatsForHeroes(
							validOptions.validHeroes,
							[],
							[],
							duelsTopDecks,
							mmrFilter,
							period,
							patch,
							stage,
						),
					);
				}
				console.debug('built top deck stats', topDeckStatsForHeroes);
				return { decks: topDeckStatsForHeroes, period: period };
			}),
		);
		this.timeFrame$ = topDecks$.pipe(this.mapData((topDecks) => topDecks.period));

		const metaHeroStats$ = combineLatest([this.store.duelsMetaStats$(), stage$, validOptions$, playerRuns$]).pipe(
			this.mapData(([duelsMetaStats, stage, validOptions, playerRuns]) => {
				// Build stats like winrate
				const duelsHeroStats = filterDuelsHeroStats(
					duelsMetaStats?.heroes,
					validOptions.validHeroes as CardIds[],
					validOptions.validHeroPowers as CardIds[],
					validOptions.validSignatureTreasures as CardIds[],
					stage,
					this.allCards,
					null,
				).filter((stat) => stat.date === 'last-patch');
				const enrichedStats: readonly DuelsHeroPlayerStat[] = buildDuelsHeroPlayerStats(
					duelsHeroStats,
					stage,
					playerRuns,
				);
				return enrichedStats;
			}),
		);

		this.heroInfo$ = combineLatest([
			this.selectedOptionCardId.asObservable(),
			heroLoadout$,
			stage$,
			metaHeroStats$,
			topDecks$,
		]).pipe(
			this.mapData(([currentOptionCardId, heroLoadout, stage, duelsMetaStats, topDecks]) => {
				if (!currentOptionCardId) {
					return null;
				}

				// The top decks
				const topDecksForOption = topDecks.decks.find((d) => d.cardId === currentOptionCardId)?.topDecks;
				const metaStatsForHero = duelsMetaStats.find((s) => s.cardId === currentOptionCardId);
				console.debug('stat for option', currentOptionCardId, metaStatsForHero, topDecksForOption);
				const result = this.buildDuelsHeroFullStat(currentOptionCardId, metaStatsForHero, topDecksForOption);
				console.debug('final result', currentOptionCardId, result?.stat);
				return result?.stat;
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
			// .sort((a, b) => new Date(b.runStartDate).getTime() - new Date(a.runStartDate).getTime())
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
		this.selectedOptionCardId.next(cardId);
	}

	onMouseLeave(cardId: string, event: MouseEvent) {
		if (!event.shiftKey) {
			this.selectedOptionCardId.next(null);
		}
	}

	trackByFn(index: number, item: ReferenceCard) {
		return item.id;
	}
}

export const buildTopDeckStatsForHeroes = (
	allHeroCardIds: readonly string[],
	allHeroPowerCardIds: readonly string[],
	allSigTreasureCardIds: readonly string[],
	duelsTopDecks: readonly DuelsGroupedDecks[],
	trueMmrFilter: number,
	timeFilter: DuelsTimeFilterType,
	patch: PatchInfo,
	stage: DuelsStatTypeFilterType,
) => {
	console.debug(
		'building top decks',
		allHeroCardIds,
		allHeroPowerCardIds,
		allSigTreasureCardIds,
		duelsTopDecks.flatMap((g) => g.decks),
	);
	const topDecks = buildTopDecks(
		allHeroCardIds,
		allHeroPowerCardIds,
		allSigTreasureCardIds,
		duelsTopDecks,
		trueMmrFilter,
		timeFilter,
		patch,
	);
	console.debug(
		'built all top decks',
		allHeroCardIds,
		allHeroPowerCardIds,
		allSigTreasureCardIds,
		timeFilter,
		topDecks,
	);

	const keyExtractor = (d: DuelsDeckStat) =>
		stage === 'hero' ? d.heroCardId : stage === 'hero-power' ? d.heroPowerCardId : d.signatureTreasureCardId;
	const groupedByOption = groupByFunction(keyExtractor)(topDecks);
	console.debug('grouped by option', groupedByOption);
	const result = Object.keys(groupedByOption).map((option) => {
		return {
			cardId: option,
			topDecks: [...groupedByOption[option]].sort(sortByProperties((a: DuelsDeckStat) => [a.dustCost, a.wins])),
		};
	});
	return result;

	// const topDecksForOption = topDecks.decks.filter((d) =>
	// 	stage === 'hero'
	// 		? d.heroCardId === currentOptionCardId
	// 		: stage === 'hero-power'
	// 		? d.heroPowerCardId === currentOptionCardId
	// 		: d.signatureTreasureCardId === currentOptionCardId,
	// );

	// return topDecks.sort(sortByProperties((a: DuelsDeckStat) => [a.dustCost, a.wins]));
	// return allHeroCardIds.map((cardId) => {
	// 	return {
	// 		cardId: cardId,
	// 		topDecks: topDecks.sort(sortByProperties((a: DuelsDeckStat) => [a.dustCost, a.wins])),
	// 	};
	// });
};

const buildTopDecks = (
	allHeroCards: readonly string[],
	allHeroPowerCardIds: readonly string[],
	allSigTreasureCardIds: readonly string[],
	duelsTopDecks: readonly DuelsGroupedDecks[],
	trueMmrFilter: number,
	timeFilter: DuelsTimeFilterType,
	patch: PatchInfo,
): readonly DuelsDeckStat[] => {
	return (
		(duelsTopDecks ?? [])
			.map((deck) =>
				topDeckApplyFilters(
					deck,
					trueMmrFilter,
					allHeroCards as CardIds[],
					allHeroPowerCardIds as CardIds[],
					allSigTreasureCardIds as CardIds[],
					timeFilter,
					null,
					null,
					patch,
				),
			)
			// .filter((group) => group.decks.length > 0)
			.flatMap((group) => group.decks)
	);
};
