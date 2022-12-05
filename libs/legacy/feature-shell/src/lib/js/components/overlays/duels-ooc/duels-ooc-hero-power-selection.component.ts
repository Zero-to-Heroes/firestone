import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent } from '@components/abstract-subscription.component';
import { DuelsHeroInfoTopDeck, DuelsHeroPowerInfo } from '@components/overlays/duels-ooc/duels-hero-info';
import { allDuelsHeroes, CardIds, duelsHeroConfigs, ReferenceCard } from '@firestone-hs/reference-data';
import { DuelsTimeFilterSelectedEvent } from '@legacy-import/src/lib/js/services/mainwindow/store/events/duels/duels-time-filter-selected-event';
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
	selector: 'duels-ooc-hero-power-selection',
	styleUrls: ['../../../../css/component/overlays/duels-ooc/duels-ooc-hero-power-selection.component.scss'],
	template: `
		<div class="container" *ngIf="heroPowers$ | async as heroPowers">
			<div class="cell" *ngFor="let heroPower of heroPowers; trackBy: trackByFn">
				<div
					class="empty-card"
					(mouseenter)="onMouseEnter(heroPower.id)"
					(mouseleave)="onMouseLeave(heroPower.id, $event)"
				></div>
			</div>
		</div>
		<duels-hero-power-info
			*ngIf="heroPowerInfo$ | async as heroPowerInfo"
			[heroPowerInfo]="heroPowerInfo"
		></duels-hero-power-info>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsOutOfCombatHeroPowerSelectionComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit
{
	heroPowers$: Observable<readonly ReferenceCard[]>;
	heroPowerInfo$: Observable<DuelsHeroPowerInfo>;

	private selectedHeroPowerCardId = new BehaviorSubject<string>(null);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.store.send(new DuelsTimeFilterSelectedEvent('last-patch'));

		this.heroPowers$ = this.store
			.listen$(([state, prefs]) => state?.duels?.heroPowerOptions)
			.pipe(
				filter(([options]) => !!options?.length),
				this.mapData(([options]) => options.map((option) => this.allCards.getCardFromDbfId(option.DatabaseId))),
			);
		const allStats$ = combineLatest(
			this.store.duelsRuns$(),
			this.heroPowers$,
			this.store.listen$(
				([main, nav]) => main.duels.globalStats?.heroes,
				([main, nav]) => main.duels.topDecks,
				([main, nav]) => main.duels.globalStats?.mmrPercentiles,
				([main, nav]) => main.duels.adventuresInfo,
				([main, nav, prefs]) => prefs.duelsActiveMmrFilter,
				([main, nav, prefs]) => prefs.duelsActiveTopDecksDustFilter,
				([main, nav, prefs]) => main.duels.currentDuelsMetaPatch,
			),
		).pipe(
			this.mapData(
				([
					runs,
					allHeroPowerCards,
					[duelStats, duelsTopDecks, mmrPercentiles, adventuresInfo, mmrFilter, dustFilter, patch],
				]) => {
					return allHeroPowerCards
						.map((card) => card.id)
						.map((currentHeroPowerCardId) => {
							const stats = buildDuelsHeroPlayerStats(
								filterDuelsHeroStats(
									duelStats,
									allDuelsHeroes,
									currentHeroPowerCardId,
									'all',
									'hero-power',
									this.allCards,
									null,
								),
								'hero-power',
								// TODO: remove this filter and use the current Duels mode from memory
								filterDuelsRuns(
									runs,
									'last-patch',
									allDuelsHeroes,
									'all',
									null,
									patch,
									0,
									currentHeroPowerCardId,
									'all',
									'hero-power',
								),
							);
							const stat: DuelsHeroPlayerStat = stats.find((s) => s.cardId === currentHeroPowerCardId);
							if (!stat) {
								console.warn('missing stat', currentHeroPowerCardId, stats);
								return null;
							}

							const trueMmrFilter = getDuelsMmrFilterNumber(mmrPercentiles, mmrFilter);
							const topDecks = duelsTopDecks
								.map((deck) =>
									topDeckApplyFilters(
										deck,
										trueMmrFilter,
										allDuelsHeroes,
										currentHeroPowerCardId,
										'all',
										'last-patch',
										dustFilter,
										null,
										patch,
									),
								)
								.filter((group) => group.decks.length > 0)
								.flatMap((group) => group.decks);
							const heroPowerDecks = topDecks
								.filter((deck) => deck.heroPowerCardId === currentHeroPowerCardId)
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
									`${deck.decklist}-${deck.heroPowerCardId}-${deck.signatureTreasureCardId}`,
							)(heroPowerDecks);
							const uniqueDecks = Object.values(groupedDecks).map((decks) => decks[0]);
							const card = this.allCards.getCard(currentHeroPowerCardId);
							const result: DuelsHeroPowerInfo = {
								cardId: currentHeroPowerCardId,
								heroCardId: stat.hero,
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
								cardId: currentHeroPowerCardId,
								stat: result,
							};
						});
				},
			),
		);
		this.heroPowerInfo$ = combineLatest(this.selectedHeroPowerCardId.asObservable(), allStats$).pipe(
			this.mapData(([currentHeroPowerCardId, allStats]) => {
				if (!currentHeroPowerCardId) {
					return null;
				}

				const result = allStats.find((stat) => stat?.cardId === currentHeroPowerCardId)?.stat;
				if (!!result) {
					return result;
				}

				const heroConfig = duelsHeroConfigs.find((conf) =>
					conf.heroPowers?.includes(currentHeroPowerCardId as CardIds),
				);
				const emptyWinDistribution: readonly { winNumber: number; value: number }[] = [...Array(13).keys()].map(
					(value, index) => ({
						winNumber: index,
						value: 0,
					}),
				);
				return {
					cardId: currentHeroPowerCardId,
					heroCardId: heroConfig?.hero,
					name: this.allCards.getCard(currentHeroPowerCardId)?.name,
					globalTotalMatches: 0,
					globalWinDistribution: emptyWinDistribution,
					playerMatches: 0,
				} as DuelsHeroPowerInfo;
			}),
		);
	}

	async onMouseEnter(cardId: string) {
		// this.selectedHeroPowerCardId.next(null);
		// await sleep(100);
		this.selectedHeroPowerCardId.next(cardId);
	}

	onMouseLeave(cardId: string, event: MouseEvent) {
		if (!event.shiftKey) {
			this.selectedHeroPowerCardId.next(null);
		}
	}

	trackByFn(index: number, item: ReferenceCard) {
		return item.id;
	}
}
