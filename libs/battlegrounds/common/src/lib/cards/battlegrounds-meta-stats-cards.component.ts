/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @angular-eslint/template/no-negated-async */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { CardType } from '@firestone-hs/reference-data';
import {
	BgsMetaCardStatTier,
	BgsMetaCardStatTierItem,
	ColumnSortTypeCard,
	buildCardStats,
	buildCardTiers,
} from '@firestone/battlegrounds/data-access';
import { BgsCardTierFilterType, BgsCardTypeFilterType, PreferencesService } from '@firestone/shared/common/service';
import { SortCriteria } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, getDateAgo, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, filter, tap } from 'rxjs';
import { BattlegroundsCardsService } from './bgs-cards.service';

@Component({
	selector: 'battlegrounds-meta-stats-cards',
	styleUrls: [`./battlegrounds-meta-stats-cards-columns.scss`, `./battlegrounds-meta-stats-cards.component.scss`],
	template: `
		<section class="battlegrounds-meta-stats-cards" [attr.aria-label]="'Battlegrounds meta card stats'">
			<div class="data-info">
				<div class="label" [fsTranslate]="'app.decktracker.meta.last-updated'"></div>
				<div class="value" [helpTooltip]="lastUpdateFull$ | async">{{ lastUpdate$ | async }}</div>
				<!-- TODO: improve total games -->
				<div class="separator">-</div>
				<div class="label" [fsTranslate]="'app.decktracker.meta.total-games'"></div>
				<div class="value">{{ totalGames$ | async }}</div>
			</div>
			<div class="explanation" [ngClass]="{ collapsed: headerCollapsed }">
				<div class="explanation-header" (click)="toggleHeader()">How does this work?</div>
				<div class="text">
					<p>
						Card stats look at how individual cards perform in Battlegrounds games. More specifically, we
						look at all games a single card has been played at some point during the game, and use this to
						compute the final average placement.
					</p>
					<p>
						If you select multiple tiers at the same time, we only consider the turns that are relevant from
						the higher tiers. For instance, if you select all tiers at once, you will see stats only
						including turns 10+. This is to avoid the inherent bias of the higher tiers naturally having a
						lower average placement - because to play one you need to have survived for that long already.
					</p>
				</div>
			</div>

			<div class="header" *ngIf="sortCriteria$ | async as sort">
				<div class="cell image"></div>
				<div class="cell name" [fsTranslate]="'app.battlegrounds.tier-list.header-card-details'"></div>
				<sortable-table-label
					class="cell average-placement"
					[name]="'app.battlegrounds.tier-list.header-average-position' | fsTranslate"
					[sort]="sort"
					[criteria]="'average-position'"
					(sortClick)="onSortClick($event)"
				>
				</sortable-table-label>
			</div>
			<div class="cards-list" role="list" scrollable>
				<ng-container *ngIf="sortCriteria$ | async as sort">
					<ng-container
						*ngIf="sort.criteria === 'average-position' || sort.criteria === 'average-position-high-mmr'"
					>
						<battlegrounds-meta-stats-card-tier
							*ngFor="let tier of tiers$ | async; trackBy: trackByFn"
							role="listitem"
							[tier]="tier"
						></battlegrounds-meta-stats-card-tier>
					</ng-container>
					<!-- <ng-container
						*ngIf="sort.criteria !== 'average-position' && sort.criteria !== 'average-position-high-mmr'"
					>
						<ng-container *ngFor="let tier of tiers$ | async">
							<battlegrounds-meta-stats-card-info
								class="item-info"
								*ngFor="let stat of tier.items; trackBy: trackByFnItem"
								role="listitem"
								[stat]="stat"
							></battlegrounds-meta-stats-card-info>
						</ng-container>
					</ng-container> -->
				</ng-container>
			</div>
		</section>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsCardsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	tiers$: Observable<readonly BgsMetaCardStatTier[]>;

	lastUpdate$: Observable<string | null>;
	lastUpdateFull$: Observable<string | null>;
	totalGames$: Observable<string>;

	sortCriteria$: Observable<SortCriteria<ColumnSortTypeCard>>;

	headerCollapsed = true;

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortTypeCard>>({
		criteria: 'average-position',
		direction: 'asc',
	});

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly bgCards: BattlegroundsCardsService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	trackByFn(index: number, stat: BgsMetaCardStatTier) {
		return stat.id;
	}
	trackByFnItem(index: number, stat: BgsMetaCardStatTierItem) {
		return stat.cardId;
	}

	async ngAfterContentInit() {
		await waitForReady(this.bgCards, this.prefs);

		this.sortCriteria$ = this.sortCriteria$$.asObservable();
		const stats$ = combineLatest([
			this.bgCards.cardStats$$,
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({
					cardTiers: prefs.bgsActiveCardsTiers,
				})),
			),
		]).pipe(
			this.mapData(([stats, { cardTiers }]) => {
				const minTurn = buildMinTurn(cardTiers);
				return buildCardStats(stats?.cardStats ?? [], minTurn, this.allCards);
			}),
			tap((stats) => console.debug('received stats for cards', stats)),
		);
		this.tiers$ = combineLatest([
			stats$,
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({
					cardType: prefs.bgsActiveCardsCardType,
					searchString: prefs.bgsActiveCardsSearch,
					cardTiers: prefs.bgsActiveCardsTiers,
				})),
			),
			this.sortCriteria$$,
		]).pipe(
			tap((info) => console.debug('received info for cards', info)),
			filter(([stats, { cardType, cardTiers, searchString }, sortCriteria]) => !!stats?.length),
			this.mapData(([stats, { cardType, cardTiers, searchString }, sortCriteria]) => {
				const filtered =
					stats
						.filter(
							(stat) =>
								!cardTiers?.length ||
								cardTiers.includes(
									this.allCards.getCard(stat.cardId).techLevel as BgsCardTierFilterType,
								),
						)
						.filter((stat) => this.isCorrectType(stat, cardType)) ?? [];
				const tiers = buildCardTiers(filtered, sortCriteria, this.i18n);
				const result = !!searchString?.length
					? tiers
							.map((t) => {
								return {
									...t,
									items: t.items.filter((i) =>
										i.name.toLowerCase().includes(searchString.toLowerCase()),
									),
								};
							})
							.filter((t) => t.items.length > 0)
					: tiers;
				return result;
			}),
		);
		this.totalGames$ = this.tiers$.pipe(
			filter((stats) => !!stats),
			this.mapData(
				(stats) =>
					Math.max(...(stats?.flatMap((s) => s.items)?.map((i) => i.dataPoints) ?? [])).toLocaleString(
						this.i18n.formatCurrentLocale() ?? 'enUS',
					) ?? '-',
			),
		);
		const lastUpdate$: Observable<string | null> = this.bgCards.cardStats$$.pipe(
			this.mapData((stats) => (stats ? '' + stats.lastUpdateDate : null)),
		);
		this.lastUpdate$ = lastUpdate$.pipe(
			filter((date): date is string => !!date),
			this.mapData((dateStr: string) => {
				// Show the date as a relative date, unless it's more than 1 week old
				// E.g. "2 hours ago", "3 days ago", "1 week ago", "on 12/12/2020"
				const date = new Date(dateStr);
				const now = new Date();
				const diff = now.getTime() - date.getTime();
				const days = diff / (1000 * 3600 * 24);
				if (days < 7) {
					return getDateAgo(date, this.i18n);
				}
				return date.toLocaleDateString(this.i18n.formatCurrentLocale() ?? 'enUS');
			}),
		);
		this.lastUpdateFull$ = lastUpdate$.pipe(
			filter((date): date is string => !!date),
			this.mapData((dateStr) => {
				const date = new Date(dateStr!);
				return date.toLocaleDateString(this.i18n.formatCurrentLocale() ?? 'enUS', {
					year: 'numeric',
					month: 'numeric',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric',
				});
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onSortClick(rawCriteria: string) {
		const criteria: ColumnSortTypeCard = rawCriteria as ColumnSortTypeCard;
		// No point in sorting by the "worse hero" first, at least until I've got asks for it
		if (criteria === this.sortCriteria$$.value?.criteria) {
			return;
		}

		this.sortCriteria$$.next({
			criteria: criteria,
			direction: getDefaultDirection(criteria),
		});
	}

	toggleHeader() {
		this.headerCollapsed = !this.headerCollapsed;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private isCorrectType(stat: BgsMetaCardStatTierItem, cardType: BgsCardTypeFilterType): boolean {
		switch (cardType) {
			case 'minion':
				return this.allCards.getCard(stat.cardId).type?.toUpperCase() === CardType[CardType.MINION];
			case 'spell':
				return this.allCards.getCard(stat.cardId).type?.toUpperCase() === CardType[CardType.BATTLEGROUND_SPELL];
			default:
				return false;
		}
	}
}

const getDefaultDirection = (criteria: ColumnSortTypeCard): 'asc' | 'desc' => {
	switch (criteria) {
		case 'average-position':
			// case 'average-position-high-mmr':
			return 'asc';
		// case 'pick-rate':
		// case 'pick-rate-high-mmr':
		default:
			return 'desc';
	}
};

const buildMinTurn = (cardTier: readonly BgsCardTierFilterType[] | undefined): number => {
	if (!cardTier?.length) {
		return 1;
	}
	const maxTier = Math.max(...cardTier);
	switch (maxTier) {
		case 1:
			return 1;
		case 2:
			return 2;
		case 3:
			return 4;
		case 4:
			return 6;
		case 5:
			return 8;
		case 6:
		case 7:
			return 10;
		default:
			return 1;
	}
};
