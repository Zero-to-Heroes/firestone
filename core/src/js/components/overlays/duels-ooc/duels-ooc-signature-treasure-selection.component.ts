import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent } from '@components/abstract-subscription.component';
import { DuelsHeroInfoTopDeck, DuelsSignatureTreasureInfo } from '@components/overlays/duels-ooc/duels-hero-info';
import {
	allDuelsHeroes,
	CardIds,
	duelsHeroConfigs,
	normalizeDuelsHeroCardId,
	ReferenceCard,
} from '@firestone-hs/reference-data';
import { DuelsHeroPlayerStat } from '@models/duels/duels-player-stats';
import { CardsFacadeService } from '@services/cards-facade.service';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
import {
	buildDuelsHeroPlayerStats,
	filterDuelsHeroStats,
	filterDuelsRuns,
	getDuelsMmrFilterNumber,
	topDeckApplyFilters,
} from '@services/ui-store/duels-ui-helper';
import { groupByFunction, uuid } from '@services/utils';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
	selector: 'duels-ooc-signature-treasure-selection',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/overlays/duels-ooc/duels-ooc-signature-treasure-selection.component.scss',
	],
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
	extends AbstractSubscriptionComponent
	implements AfterContentInit {
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
			this.store.listen$(
				([main, nav]) => main.duels.globalStats?.heroes,
				([main, nav]) => main.duels.topDecks,
				([main, nav]) => main.duels.globalStats?.mmrPercentiles,
				([main, nav]) => main.duels.runs,
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
					[duelStats, duelsTopDecks, mmrPercentiles, runs, dustFilter, mmrFilter, patch],
				]) => {
					return allSignatureTreasureCards
						.map((card) => card.id)
						.map((currentSignatureTreasureCardId) => {
							const stats = buildDuelsHeroPlayerStats(
								filterDuelsHeroStats(
									duelStats,
									allDuelsHeroes,
									selectedHeroPower,
									'all',
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
									selectedHeroPower,
									currentSignatureTreasureCardId,
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
							const topDecks = duelsTopDecks
								.map((deck) =>
									topDeckApplyFilters(
										deck,
										trueMmrFilter,
										allDuelsHeroes,
										selectedHeroPower,
										currentSignatureTreasureCardId,
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

	async onMouseEnter(cardId: string) {
		// this.selectedSignatureTreasureCardId.next(null);
		// await sleep(100);
		console.debug('[duels-ooc-hero-selection] mouseenter', cardId);
		this.selectedSignatureTreasureCardId.next(cardId);
	}

	onMouseLeave(cardId: string, event: MouseEvent) {
		if (!event.shiftKey) {
			console.debug('[duels-ooc-hero-selection] mouseleave', cardId);
			this.selectedSignatureTreasureCardId.next(null);
		}
	}

	trackByFn(index: number, item: ReferenceCard) {
		return item.id;
	}
}
