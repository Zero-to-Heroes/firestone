import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent } from '@components/abstract-subscription.component';
import { DuelsHeroInfo, DuelsHeroInfoTopDeck } from '@components/overlays/duels-ooc/duels-hero-info';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { DuelsHeroPlayerStat } from '@models/duels/duels-player-stats';
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
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/overlays/duels-ooc/duels-ooc-hero-selection.component.scss',
	],
	template: `
		<div class="container" *ngIf="heroes$ | async as heroes">
			<div class="cell" *ngFor="let hero of heroes; trackBy: trackByFn">
				<div class="empty-card" (mouseenter)="onMouseEnter(hero.id)" (mouseleave)="onMouseLeave(hero.id)"></div>
			</div>
		</div>
		<duels-hero-info *ngIf="heroInfo$ | async as heroInfo" [heroInfo]="heroInfo"></duels-hero-info>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsOutOfCombatHeroSelectionComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	heroes$: Observable<readonly ReferenceCard[]>;
	heroInfo$: Observable<DuelsHeroInfo>;

	private selectedHeroCardId = new BehaviorSubject<string>(null);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.heroes$ = this.store
			.listen$(([state, prefs]) => state?.duels?.heroOptionsDbfIds)
			.pipe(
				filter(([heroDbfIds]) => !!heroDbfIds?.length),
				this.mapData(([heroDbfIds]) => heroDbfIds.map((dbfId) => this.allCards.getCardFromDbfId(dbfId))),
			);

		const allStats$ = combineLatest(
			this.heroes$,
			this.store.listen$(
				([main, nav]) => main.duels.globalStats?.heroes,
				([main, nav]) => main.duels.topDecks,
				([main, nav]) => main.duels.runs,
				([main, nav]) => main.duels.globalStats?.mmrPercentiles,
				([main, nav, prefs]) => prefs.duelsActiveMmrFilter,
				([main, nav, prefs]) => prefs.duelsActiveTopDecksDustFilter,
				([main, nav, prefs]) => main.duels.currentDuelsMetaPatch,
			),
		).pipe(
			filter(([allHeroCards, [duelStats, duelsTopDecks]]) => !!duelStats?.length && !!duelsTopDecks?.length),
			this.mapData(
				([allHeroCards, [duelStats, duelsTopDecks, runs, mmrPercentiles, mmrFilter, dustFilter, patch]]) => {
					return allHeroCards
						.map((card) => card.id)
						.map((cardId) => {
							const stats = buildDuelsHeroPlayerStats(
								filterDuelsHeroStats(duelStats, 'all', null, null, 'hero', this.allCards, null),
								'hero',
								// TODO: remove this filter and use the current Duels mode from memory
								filterDuelsRuns(runs, 'last-patch', 'all', 'all', patch, 0, 'all', 'all', 'hero'),
							).filter((stat) =>
								// Because of Drek'That and Vanndar
								// It's not necessary to update the Hero Power and Signature Treasures
								// components because at that point the Hero Power uniquely identifies
								// the stat
								allHeroCards
									.map((card) => card.id)
									.some((heroCardId) => stat.cardId.startsWith(heroCardId)),
							);
							const stat: DuelsHeroPlayerStat = mergeDuelsHeroPlayerStats(
								stats.filter((s) => s.cardId.startsWith(cardId)),
								cardId,
							);
							if (!stat) {
								console.warn('missing stat', cardId, stats);
								return null;
							}

							const trueMmrFilter = getDuelsMmrFilterNumber(mmrPercentiles, mmrFilter);
							const topDecks = duelsTopDecks
								.map((deck) =>
									topDeckApplyFilters(
										deck,
										trueMmrFilter,
										'all',
										'all',
										'all',
										'last-patch',
										dustFilter,
										patch,
									),
								)
								.filter((group) => group.decks.length > 0)
								.flatMap((group) => group.decks)
								.filter((deck) =>
									allHeroCards
										.map((hero) => hero.id)
										.some((heroCardId) => deck.heroCardId.startsWith(heroCardId)),
								);
							const heroDecks = topDecks
								.filter((deck) => deck.heroCardId.startsWith(cardId))
								.sort((a, b) => b.rating - a.rating)
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
							// console.debug('hero decks', heroDecks, topDecks);
							// Remove duplicate decklists
							const groupedDecks = groupByFunction(
								(deck: DuelsHeroInfoTopDeck) =>
									`${deck.decklist}-${deck.heroPowerCardId}-${deck.signatureTreasureCardId}`,
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
						});
				},
			),
		);
		this.heroInfo$ = combineLatest(this.selectedHeroCardId.asObservable(), allStats$).pipe(
			this.mapData(([currentHeroCardId, allStats]) => {
				if (!currentHeroCardId) {
					return null;
				}
				return allStats.find((stat) => stat.cardId === currentHeroCardId).stat;
			}),
		);
	}

	onMouseEnter(cardId: string) {
		console.debug('[duels-ooc-hero-selection] mouseenter', cardId);
		this.selectedHeroCardId.next(cardId);
	}

	onMouseLeave(cardId: string) {
		console.debug('[duels-ooc-hero-selection] mouseleave', cardId);
		this.selectedHeroCardId.next(null);
	}

	trackByFn(index: number, item: ReferenceCard) {
		return item.id;
	}
}
