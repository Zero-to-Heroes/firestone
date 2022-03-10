import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionComponent } from '@components/abstract-subscription.component';
import { DuelsHeroInfo } from '@components/overlays/duels-ooc/duels-hero-info';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { DuelsHeroPlayerStat } from '@models/duels/duels-player-stats';
import { CardsFacadeService } from '@services/cards-facade.service';
import { AppUiStoreFacadeService } from '@services/ui-store/app-ui-store-facade.service';
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
		const stats$ = combineLatest(this.heroes$, this.store.duelsHeroStats$()).pipe(
			filter(([heroes, stats]) => !!stats?.length && !!heroes?.length),
			this.mapData(([heroes, stats]) =>
				stats.filter((stat) => heroes.map((hero) => hero.id).includes(stat.cardId)),
			),
		);
		const topDecks$ = combineLatest(this.heroes$, this.store.duelsTopDecks$()).pipe(
			this.mapData(([heroes, topDecks]) =>
				topDecks
					.flatMap((group) => group.decks)
					.filter((deck) => heroes.map((hero) => hero.id).includes(deck.heroCardId)),
			),
		);
		this.heroInfo$ = combineLatest(this.selectedHeroCardId.asObservable(), stats$, topDecks$).pipe(
			this.mapData(([cardId, stats, topDecks]) => {
				if (!cardId) {
					return null;
				}

				const stat: DuelsHeroPlayerStat = stats.find((s) => s.cardId === cardId);
				console.debug('[duels-ooc-hero-selection] heroInfo start', cardId, stats, topDecks);
				const card = this.allCards.getCard(cardId);
				const result: DuelsHeroInfo = {
					cardId: cardId,
					name: card.name,
					globalWinrate: stat.globalWinrate,
					playerWinrate: stat.playerWinrate,
					globalPopularity: stat.globalPopularity,
					playerMatches: stat.playerTotalMatches,
					globalWinDistribution: stat.globalWinDistribution,
					topDecks: [],
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
	}

	trackByFn(index: number, item: ReferenceCard) {
		return item.id;
	}
}
