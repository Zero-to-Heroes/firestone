import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { DuelsHeroInfoTopDeck, DuelsSignatureTreasureInfo } from '@components/overlays/duels-ooc/duels-hero-info';
import {
	CardIds,
	ReferenceCard,
	allDuelsHeroes,
	duelsHeroConfigs,
	normalizeDuelsHeroCardId,
} from '@firestone-hs/reference-data';
import { filterDuelsHeroStats } from '@firestone/duels/data-access';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DuelsTimeFilterSelectedEvent } from '@legacy-import/src/lib/js/services/mainwindow/store/events/duels/duels-time-filter-selected-event';
import { DuelsHeroPlayerStat } from '@models/duels/duels-player-stats';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import {
	buildDuelsHeroPlayerStats,
	filterDuelsRuns,
	getDuelsMmrFilterNumber,
	topDeckApplyFilters,
} from '@services/ui-store/duels-ui-helper';
import { groupByFunction, uuid } from '@services/utils';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
	selector: 'duels-ooc-signature-treasure-selection',
	styleUrls: ['../../../../css/component/overlays/duels-ooc/duels-ooc-signature-treasure-selection.component.scss'],
	template: `
		<div class="container" *ngIf="signatureTreasures$ | async as signatureTreasures">
			<div class="cell" *ngFor="let signatureTreasure of signatureTreasures; trackBy: trackByFn">
				<div
					class="empty-card"
					(mouseenter)="onMouseEnter(signatureTreasure.id)"
					(mouseleave)="onMouseLeave(signatureTreasure.id, $event)"
				></div>
			</div>
		</div>
		<duels-signature-treasure-info
			*ngIf="signatureTreasureInfo$ | async as signatureTreasureInfo"
			[signatureTreasureInfo]="signatureTreasureInfo"
		></duels-signature-treasure-info>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsOutOfCombatSignatureTreasureSelectionComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit
{
	signatureTreasures$: Observable<readonly ReferenceCard[]>;
	signatureTreasureInfo$: Observable<DuelsSignatureTreasureInfo>;

	private selectedSignatureTreasureCardId = new BehaviorSubject<string>(null);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.store.send(new DuelsTimeFilterSelectedEvent('last-patch'));

		this.signatureTreasures$ = this.store
			.listen$(([state, prefs]) => state?.duels?.signatureTreasureOptions)
			.pipe(
				filter(([options]) => !!options?.length),
				this.mapData(([options]) => options.map((option) => this.allCards.getCardFromDbfId(option.DatabaseId))),
			);
		const selectedHeroPower$ = this.store
			.listen$(([main, nav]) => main.duels?.heroPowerOptions)
			.pipe(
				filter(([heroPowerOptions]) => !!heroPowerOptions?.length),
				this.mapData(([heroPowerOptions]) => {
					const selectedOption = heroPowerOptions.find((option) => option.Selected);
					const refCard = this.allCards.getCardFromDbfId(selectedOption?.DatabaseId);
					if (!refCard) {
						console.log('[duels-ooc-hero-selection] refCard not found', selectedOption, heroPowerOptions);
					}
					return refCard?.id;
				}),
			);
		const allStats$ = combineLatest(
			this.signatureTreasures$,
			selectedHeroPower$,
			this.store.duelsRuns$(),
			this.store.listen$(
				([main, nav]) => main.duels.globalStats?.heroes,
				([main, nav]) => main.duels.getTopDecks(),
				([main, nav]) => main.duels.globalStats?.mmrPercentiles,
				([main, nav, prefs]) => prefs.duelsActiveTopDecksDustFilter,
				([main, nav, prefs]) => prefs.duelsActiveMmrFilter,
				([main, nav, prefs]) => main.duels.currentDuelsMetaPatch,
			),
		).pipe(
			filter(([selectedHeroPower]) => !!selectedHeroPower),
			this.mapData(
				([
					allSignatureTreasureCards,
					selectedHeroPower,
					runs,
					[duelStats, duelsTopDecks, mmrPercentiles, dustFilter, mmrFilter, patch],
				]) => {
					return allSignatureTreasureCards
						.map((card) => card.id)
						.map((currentSignatureTreasureCardId) => {
							const stats = buildDuelsHeroPlayerStats(
								filterDuelsHeroStats(
									duelStats,
									allDuelsHeroes,
									[selectedHeroPower],
									[],
									'signature-treasure',
									this.allCards,
									null,
								),
								'signature-treasure',
								// TODO: remove this filter and use the current Duels mode from memory
								filterDuelsRuns(
									runs,
									'last-patch',
									allDuelsHeroes,
									'all',
									null,
									patch,
									0,
									[selectedHeroPower],
									[currentSignatureTreasureCardId],
									'signature-treasure',
								),
							);
							const stat: DuelsHeroPlayerStat = stats.find(
								(s) => s.cardId === currentSignatureTreasureCardId,
							);
							if (!stat) {
								console.warn('missing stat', currentSignatureTreasureCardId, stats);
								return null;
							}

							const trueMmrFilter = getDuelsMmrFilterNumber(mmrPercentiles, mmrFilter);
							const topDecks = (duelsTopDecks ?? [])
								.map((deck) =>
									topDeckApplyFilters(
										deck,
										trueMmrFilter,
										allDuelsHeroes,
										[selectedHeroPower],
										[currentSignatureTreasureCardId],
										'last-patch',
										dustFilter,
										null,
										patch,
									),
								)
								.filter((group) => group.decks.length > 0)
								.flatMap((group) => group.decks);
							const signatureTreasureDecks = topDecks
								.filter((deck) => deck.signatureTreasureCardId === currentSignatureTreasureCardId)
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
								(deck: DuelsHeroInfoTopDeck) =>
									`${deck.decklist}-${deck.signatureTreasureCardId}-${deck.signatureTreasureCardId}`,
							)(signatureTreasureDecks);
							const uniqueDecks = Object.values(groupedDecks).map((decks) => decks[0]);
							const card = this.allCards.getCard(currentSignatureTreasureCardId);
							const result: DuelsSignatureTreasureInfo = {
								cardId: currentSignatureTreasureCardId,
								heroCardId: stat.hero,
								heroPowerCardId: selectedHeroPower,
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
								cardId: currentSignatureTreasureCardId,
								stat: result,
							};
						});
				},
			),
		);
		this.signatureTreasureInfo$ = combineLatest(
			this.selectedSignatureTreasureCardId.asObservable(),
			selectedHeroPower$,
			allStats$,
		).pipe(
			this.mapData(([currentSignatureTreasureCardId, heroPowerCardId, allStats]) => {
				if (!currentSignatureTreasureCardId) {
					return null;
				}

				const heroPowerConfig = duelsHeroConfigs.find((conf) =>
					conf.heroPowers?.includes(heroPowerCardId as CardIds),
				);
				const result = allStats.find(
					(stat) =>
						stat?.cardId === currentSignatureTreasureCardId &&
						normalizeDuelsHeroCardId(stat?.stat?.heroCardId) ===
							normalizeDuelsHeroCardId(heroPowerConfig?.hero),
				)?.stat;
				// console.log('result', currentSignatureTreasureCardId, result, allStats);
				if (!!result) {
					return result;
				}

				const heroConfig = duelsHeroConfigs.find(
					(conf) =>
						conf.signatureTreasures?.includes(currentSignatureTreasureCardId as CardIds) &&
						conf.hero === heroPowerConfig?.hero,
				);
				const emptyWinDistribution: readonly { winNumber: number; value: number }[] = [...Array(13).keys()].map(
					(value, index) => ({
						winNumber: index,
						value: 0,
					}),
				);
				return {
					cardId: currentSignatureTreasureCardId,
					heroCardId: heroConfig?.hero,
					heroPowerCardId: heroPowerCardId,
					name: this.allCards.getCard(currentSignatureTreasureCardId)?.name,
					globalTotalMatches: 0,
					globalWinDistribution: emptyWinDistribution,
					playerMatches: 0,
				} as DuelsSignatureTreasureInfo;
			}),
		);
	}

	private safeguardTimeout;

	async onMouseEnter(cardId: string) {
		!!this.safeguardTimeout && clearTimeout(this.safeguardTimeout);
		this.selectedSignatureTreasureCardId.next(cardId);
		this.safeguardTimeout = setTimeout(() => this.onMouseLeave(null, null), 5000);
	}

	onMouseLeave(cardId: string, event: MouseEvent) {
		if (!event?.shiftKey) {
			this.selectedSignatureTreasureCardId.next(null);
		}
		!!this.safeguardTimeout && clearTimeout(this.safeguardTimeout);
		this.safeguardTimeout = null;
		// !!this.safeguardTimeout && clearTimeout(this.safeguardTimeout);
		// this.safeguardTimeout = null;
	}

	trackByFn(index: number, item: ReferenceCard) {
		return item.id;
	}
}
