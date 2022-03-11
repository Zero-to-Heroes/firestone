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
		const stats$ = combineLatest(
			this.heroes$,
			this.store
				.listen$(
					([main, nav]) => main.duels.globalStats?.heroes,
					([main, nav]) => main.duels.runs,
					([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
					([main, nav, prefs]) => main.duels.currentDuelsMetaPatch,
				)
				.pipe(
					filter(([heroes, other]) => !!heroes?.length),
					this.mapData(([duelStats, runs, timeFilter, patch]) =>
						buildDuelsHeroPlayerStats(
							filterDuelsHeroStats(duelStats, 'all', null, null, 'hero', this.allCards, null),
							'hero',
							// TODO: remove this filter and use the current Duels mode from memory
							filterDuelsRuns(runs, timeFilter, 'all', 'all', patch, 0, 'all', 'all', 'hero'),
						),
					),
				),
		).pipe(
			filter(([heroes, stats]) => !!stats?.length && !!heroes?.length),
			this.mapData(([heroes, stats]) => {
				console.debug('building stats', stats, heroes);
				return stats.filter((stat) =>
					// Because of Drek'That and Vanndar
					// It's not necessary to update the Hero Power and Signature Treasures
					// components because at that point the Hero Power uniquely identifies
					// the stat
					heroes.map((hero) => hero.id).some((heroCardId) => stat.cardId.startsWith(heroCardId)),
				);
			}),
		);
		const topDecks$ = combineLatest(
			this.heroes$,
			this.store.listen$(
				([main, nav]) => main.duels.topDecks,
				([main, nav]) => main.duels.globalStats?.mmrPercentiles,
				([main, nav, prefs]) => prefs.duelsActiveMmrFilter,
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveTopDecksDustFilter,
				([main, nav, prefs]) => main.duels.currentDuelsMetaPatch,
			),
		).pipe(
			filter(([heroes, [topDecks, mmrPercentiles]]) => !!topDecks?.length && !!mmrPercentiles?.length),
			this.mapData(([heroes, [topDecks, mmrPercentiles, mmrFilter, timeFilter, dustFilter, patch]]) => {
				const trueMmrFilter = getDuelsMmrFilterNumber(mmrPercentiles, mmrFilter);
				return topDecks
					.map((deck) =>
						topDeckApplyFilters(deck, trueMmrFilter, 'all', 'all', 'all', timeFilter, dustFilter, patch),
					)
					.filter((group) => group.decks.length > 0)
					.flatMap((group) => group.decks)
					.filter((deck) =>
						heroes.map((hero) => hero.id).some((heroCardId) => deck.heroCardId.startsWith(heroCardId)),
					);
			}),
		);
		this.heroInfo$ = combineLatest(this.selectedHeroCardId.asObservable(), stats$, topDecks$).pipe(
			// tap((info) => console.debug('hero info ready?', info)),
			filter(([cardId, stats, topDecks]) => !!stats?.length && !!topDecks?.length),
			this.mapData(([cardId, stats, topDecks]) => {
				if (!cardId) {
					return null;
				}

				const stat: DuelsHeroPlayerStat = mergeDuelsHeroPlayerStats(
					stats.filter((s) => s.cardId.startsWith(cardId)),
					cardId,
				);
				if (!stat) {
					console.warn('missing stat', cardId, stats);
					return null;
				}
				const heroDecks = topDecks
					.filter((deck) => deck.heroCardId.startsWith(cardId))
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
				console.debug('hero decks', heroDecks, topDecks);
				// Remove duplicate decklists
				const groupedDecks = groupByFunction(
					(deck: DuelsHeroInfoTopDeck) =>
						`${deck.decklist}-${deck.heroPowerCardId}-${deck.signatureTreasureCardId}`,
				)(heroDecks);
				const uniqueDecks = Object.values(groupedDecks).map((decks) => decks[0]);

				console.debug(
					'[duels-ooc-hero-selection] heroInfo start',
					cardId,
					stats,
					stat,
					uniqueDecks,
					heroDecks,
					groupedDecks,
				);
				const card = this.allCards.getCard(cardId);
				const result: DuelsHeroInfo = {
					cardId: cardId,
					name: card.name,
					globalWinrate: stat.globalWinrate,
					playerWinrate: stat.playerWinrate,
					globalPopularity: stat.globalPopularity,
					playerMatches: stat.playerTotalMatches,
					globalWinDistribution: stat.globalWinDistribution,
					topDecks: uniqueDecks,
				};
				return result;
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
