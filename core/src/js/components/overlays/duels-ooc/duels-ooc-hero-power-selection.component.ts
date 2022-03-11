import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent } from '@components/abstract-subscription.component';
import { DuelsHeroInfoTopDeck, DuelsHeroPowerInfo } from '@components/overlays/duels-ooc/duels-hero-info';
import { ReferenceCard } from '@firestone-hs/reference-data';
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
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/overlays/duels-ooc/duels-ooc-hero-power-selection.component.scss',
	],
	template: `
		<div class="container" *ngIf="heroPowers$ | async as heroPowers">
			<div class="cell" *ngFor="let heroPower of heroPowers; trackBy: trackByFn">
				<div
					class="empty-card"
					(mouseenter)="onMouseEnter(heroPower.id)"
					(mouseleave)="onMouseLeave(heroPower.id)"
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
	implements AfterContentInit {
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
		this.heroPowers$ = this.store
			.listen$(([state, prefs]) => state?.duels?.heroPowerOptions)
			.pipe(
				filter(([options]) => !!options?.length),
				this.mapData(([options]) => options.map((option) => this.allCards.getCardFromDbfId(option.DatabaseId))),
			);
		const allStats$ = combineLatest(
			this.heroPowers$,
			this.store.listen$(
				([main, nav]) => main.duels.globalStats?.heroes,
				([main, nav]) => main.duels.topDecks,
				([main, nav]) => main.duels.runs,
				([main, nav]) => main.duels.globalStats?.mmrPercentiles,
				([main, nav, prefs]) => prefs.duelsActiveMmrFilter,
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveTopDecksDustFilter,
				([main, nav, prefs]) => main.duels.currentDuelsMetaPatch,
			),
		).pipe(
			this.mapData(
				([
					allHeroPowerCards,
					[duelStats, duelsTopDecks, runs, mmrPercentiles, mmrFilter, timeFilter, dustFilter, patch],
				]) => {
					return allHeroPowerCards
						.map((card) => card.id)
						.map((currentHeroPowerCardId) => {
							const stats = buildDuelsHeroPlayerStats(
								filterDuelsHeroStats(
									duelStats,
									'all',
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
									timeFilter,
									'all',
									'all',
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
										'all',
										currentHeroPowerCardId,
										'all',
										timeFilter,
										dustFilter,
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
				return allStats.find((stat) => stat.cardId === currentHeroPowerCardId).stat;
			}),
		);
	}

	onMouseEnter(cardId: string) {
		console.debug('[duels-ooc-hero-selection] mouseenter', cardId);
		this.selectedHeroPowerCardId.next(cardId);
	}

	onMouseLeave(cardId: string) {
		console.debug('[duels-ooc-hero-selection] mouseleave', cardId);
		this.selectedHeroPowerCardId.next(null);
	}

	trackByFn(index: number, item: ReferenceCard) {
		return item.id;
	}
}
