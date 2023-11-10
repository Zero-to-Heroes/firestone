import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { DuelsHeroInfo, DuelsHeroInfoTopDeck } from '@components/overlays/duels-ooc/duels-hero-info';
import { CardIds, ReferenceCard, normalizeDuelsHeroCardId } from '@firestone-hs/reference-data';
import { DuelsStatTypeFilterType, DuelsTimeFilterType, filterDuelsHeroStats } from '@firestone/duels/data-access';
import { arraysEqual, groupByFunction, sortByProperties, uuidShort } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { PatchInfo } from '@legacy-import/src/lib/js/models/patches';
import { DuelsDeckStat, DuelsHeroPlayerStat } from '@models/duels/duels-player-stats';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import {
	buildDuelsHeroPlayerStats,
	filterDuelsRuns,
	getDuelsMmrFilterNumber,
	topDeckGroupApplyFilters,
} from '@services/ui-store/duels-ui-helper';
import { deepEqual } from '@services/utils';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, shareReplay } from 'rxjs/operators';
import { DuelsGroupedDecks } from '../../../models/duels/duels-grouped-decks';
import { DuelsTopDeckService } from '../../../services/duels/duels-top-decks.service';
import { PatchesConfigService } from '../../../services/patches-config.service';

@Component({
	selector: 'duels-ooc-hero-selection',
	styleUrls: ['../../../../css/component/overlays/duels-ooc/duels-ooc-hero-selection.component.scss'],
	template: `
		<div class="root {{ stage$ | async }}">
			<div class="container " *ngIf="optionCards$ | async as heroes">
				<div class="cell" *ngFor="let hero of heroes; trackBy: trackByFn">
					<div
						class="empty-card"
						(mouseenter)="onMouseEnter(hero.id)"
						(mouseleave)="onMouseLeave(hero.id, $event)"
					></div>
				</div>
			</div>
			<ng-container *ngIf="(stage$ | async) === 'hero'">
				<duels-hero-info
					class="details"
					*ngIf="heroInfo$ | async as heroInfo"
					[heroInfo]="heroInfo"
					[patch]="patch$ | async"
					[timeFrame]="timeFrame$ | async"
				></duels-hero-info>
			</ng-container>
			<ng-container *ngIf="(stage$ | async) === 'hero-power'">
				<duels-hero-power-info
					class="details"
					*ngIf="heroInfo$ | async as heroPowerInfo"
					[heroPowerInfo]="heroPowerInfo"
				></duels-hero-power-info>
			</ng-container>
			<ng-container *ngIf="(stage$ | async) === 'signature-treasure'">
				<duels-signature-treasure-info
					class="details"
					*ngIf="heroInfo$ | async as signatureTreasureInfo"
					[signatureTreasureInfo]="signatureTreasureInfo"
				></duels-signature-treasure-info>
			</ng-container>
		</div>
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
	stage$: Observable<DuelsStatTypeFilterType>;

	@Input() set stage(value: DuelsStatTypeFilterType) {
		this.stage$$.next(value);
	}

	private selectedOptionCardId$$ = new BehaviorSubject<string>(null);
	private stage$$ = new BehaviorSubject<DuelsStatTypeFilterType>(null);

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

		this.stage$ = this.stage$$;

		const heroLoadout$ = combineLatest([
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
				const result = {
					heroCardId: selectedHero?.DatabaseId,
					heroPowerCardId: selectedHeroPower?.DatabaseId,
					signatureTreasureCardId: selectedSignatureTreasure?.DatabaseId,
				};
				console.debug(
					'[duels-ooc-hero-selection] hero loadout',
					result,
					heroOptions,
					heroPowerOptions,
					signatureTreasureOptions,
				);
				return result;
			}),
			shareReplay(1),
			this.mapData((info) => info),
		);

		this.patch$ = this.patchesConfig.currentDuelsMetaPatch$$.pipe(this.mapData((info) => info));
		this.optionCards$ = combineLatest([
			this.stage$$,
			heroLoadout$,
			this.store.listen$(([state, prefs]) => state.duels),
		]).pipe(
			this.mapData(([stage, heroLoadout, [state]]) => {
				const options =
					stage === 'hero'
						? state.heroOptions
						: stage === 'hero-power'
						? state.heroPowerOptions
						: state.signatureTreasureOptions;
				return options?.map((option) => this.allCards.getCard(option.DatabaseId)) ?? [];
			}),
		);
		const optionCardIds$ = this.optionCards$.pipe(
			this.mapData((options) => {
				const result = options?.map((option) => option.id) ?? [];
				console.debug('[duels-ooc-hero-selection] option card ids', result);
				return result;
			}),
		);

		const validOptions$ = combineLatest([optionCardIds$, this.stage$$, heroLoadout$]).pipe(
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
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
				const result = {
					validHeroes,
					validHeroPowers,
					validSignatureTreasures,
				};
				console.debug('[duels-ooc-hero-selection] valid options', result, stage);
				return result;
			}),
			shareReplay(1),
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

		const topDecks$ = combineLatest([
			this.duelsTopDecks.topDeck$$,
			optionCardIds$,
			validOptions$,
			mmrFilter$,
			this.stage$$,
			this.patchesConfig.currentDuelsMetaPatch$$,
		]).pipe(
			this.mapData(([duelsTopDecks, optionCardIds, validOptions, mmrFilter, stage, patch]) => {
				let period: DuelsTimeFilterType = 'last-patch';
				let topDeckStatsForHeroes = buildTopDeckStatsForHeroes(
					optionCardIds,
					validOptions.validHeroes,
					validOptions.validHeroPowers,
					validOptions.validSignatureTreasures,
					duelsTopDecks,
					mmrFilter,
					period,
					patch,
					stage,
				);
				console.debug('top tops', period, validOptions, topDeckStatsForHeroes);
				if (!topDeckStatsForHeroes.length || topDeckStatsForHeroes.some((stat) => stat.topDecks.length === 0)) {
					period = 'past-seven';
					topDeckStatsForHeroes = buildTopDeckStatsForHeroes(
						optionCardIds,
						validOptions.validHeroes,
						validOptions.validHeroPowers,
						validOptions.validSignatureTreasures,
						duelsTopDecks,
						mmrFilter,
						period,
						patch,
						stage,
					);
					console.debug('top tops', period, topDeckStatsForHeroes);
				}
				return { decks: topDeckStatsForHeroes, period: period };
			}),
			shareReplay(1),
			this.mapData((info) => info),
		);
		this.timeFrame$ = topDecks$.pipe(this.mapData((topDecks) => topDecks.period));

		const playerRuns$ = combineLatest([
			optionCardIds$,
			validOptions$,
			this.store.duelsRuns$(),
			this.patchesConfig.currentDuelsMetaPatch$$,
			this.timeFrame$,
		]).pipe(
			filter(([optionCardIds, validOptions, runs, patch]) => !!validOptions),
			this.mapData(([optionCardIds, validOptions, runs, patch, timeFrame]) => {
				const duelsRuns = filterDuelsRuns(
					runs,
					timeFrame,
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
			shareReplay(1),
			this.mapData((info) => info),
		);

		const metaHeroStats$ = combineLatest([
			this.store.duelsMetaStats$(),
			this.stage$$,
			validOptions$,
			playerRuns$,
			this.timeFrame$, // TODO: retrieve the stats for the correct timeframe
		]).pipe(
			this.mapData(([duelsMetaStats, stage, validOptions, playerRuns, timeFrame]) => {
				// Build stats like winrate
				const duelsHeroStats = filterDuelsHeroStats(
					duelsMetaStats?.heroes,
					validOptions.validHeroes as CardIds[],
					validOptions.validHeroPowers as CardIds[],
					validOptions.validSignatureTreasures as CardIds[],
					stage,
					this.allCards,
					null,
				);
				const enrichedStats: readonly DuelsHeroPlayerStat[] = buildDuelsHeroPlayerStats(
					duelsHeroStats,
					stage,
					playerRuns,
				);
				return enrichedStats;
			}),
			shareReplay(1),
			this.mapData((info) => info),
		);

		this.heroInfo$ = combineLatest([
			this.selectedOptionCardId$$.asObservable(),
			heroLoadout$,
			this.stage$$,
			metaHeroStats$,
			topDecks$,
		]).pipe(
			this.mapData(([currentOptionCardId, heroLoadout, stage, duelsMetaStats, topDecks]) => {
				if (!currentOptionCardId) {
					return null;
				}

				const heroCardId =
					stage === 'hero' ? currentOptionCardId : this.allCards.getCard(heroLoadout.heroCardId).id;
				const heroPowerCardId =
					stage === 'hero-power'
						? currentOptionCardId
						: this.allCards.getCard(heroLoadout.heroPowerCardId).id;
				const signatureTreasureCardId =
					stage === 'signature-treasure'
						? currentOptionCardId
						: this.allCards.getCard(heroLoadout.signatureTreasureCardId).id;

				// The top decks
				const topDecksForOption = topDecks.decks.find((d) => d.cardId === currentOptionCardId)?.topDecks;
				const metaStatsForHero = duelsMetaStats.find((s) => s.cardId === currentOptionCardId);

				const result = this.buildDuelsHeroFullStat(
					heroCardId,
					heroPowerCardId,
					signatureTreasureCardId,
					currentOptionCardId,
					metaStatsForHero,
					topDecksForOption,
				);
				return result?.stat;
			}),
			shareReplay(1),
			this.mapData((info) => info),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildDuelsHeroFullStat(
		heroCardId: string,
		heroPowerCardId: string,
		signatureTreasureCardId: string,
		currentOptionCardId: string,
		stat: DuelsHeroPlayerStat,
		topDecksForHero: readonly DuelsDeckStat[],
	): {
		cardId: string;
		stat: DuelsHeroInfo;
	} {
		if (!stat) {
			return this.buildEmptyStat(heroCardId);
		}

		const heroDecks = [...(topDecksForHero ?? [])]
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

		const card = this.allCards.getCard(currentOptionCardId);
		const result: DuelsHeroInfo = {
			heroCardId: heroCardId,
			heroPowerCardId: heroPowerCardId,
			signatureTreasureCardId: signatureTreasureCardId,
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
			cardId: currentOptionCardId,
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
			heroCardId: cardId,
			heroPowerCardId: null,
			signatureTreasureCardId: null,
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
		this.selectedOptionCardId$$.next(cardId);
	}

	onMouseLeave(cardId: string, event: MouseEvent) {
		if (!event.shiftKey) {
			this.selectedOptionCardId$$.next(null);
		}
	}

	trackByFn(index: number, item: ReferenceCard) {
		return item.id;
	}
}

export const buildTopDeckStatsForHeroes = (
	optionCardIds: readonly string[],
	allHeroCardIds: readonly string[],
	allHeroPowerCardIds: readonly string[],
	allSigTreasureCardIds: readonly string[],
	duelsTopDecks: readonly DuelsGroupedDecks[],
	trueMmrFilter: number,
	timeFilter: DuelsTimeFilterType,
	patch: PatchInfo,
	stage: DuelsStatTypeFilterType,
) => {
	const topDecks = buildTopDecks(
		allHeroCardIds,
		allHeroPowerCardIds,
		allSigTreasureCardIds,
		duelsTopDecks,
		trueMmrFilter,
		timeFilter,
		patch,
	);

	const keyExtractor = (d: DuelsDeckStat) =>
		stage === 'hero' ? d.heroCardId : stage === 'hero-power' ? d.heroPowerCardId : d.signatureTreasureCardId;
	const groupedByOption = groupByFunction(keyExtractor)(topDecks);
	const result = optionCardIds.map((option) => {
		const decksForOption = groupedByOption[option] ?? [];
		return {
			cardId: option,
			topDecks: [...decksForOption].sort(sortByProperties((a: DuelsDeckStat) => [a.dustCost, a.wins])),
		};
	});
	return result;
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
				topDeckGroupApplyFilters(
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
