import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ArenaCardStat } from '@firestone-hs/arena-stats';
import { SortCriteria, SortDirection, invertDirection } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, shareReplay, startWith, tap } from 'rxjs';
import { ArenaCardStatsService } from '../../services/arena-card-stats.service';
import { ArenaCardStatInfo } from './model';

@Component({
	selector: 'arena-card-stats',
	styleUrls: [`./arena-card-stats-columns.scss`, `./arena-card-stats.component.scss`],
	template: `
		<with-loading [isLoading]="loading$ | async">
			<section
				class="arena-card-stats"
				[attr.aria-label]="'Arena card stats'"
				*ngIf="{ cards: cards$ | async } as value"
			>
				<div class="header" *ngIf="sortCriteria$ | async as sort">
					<sortable-table-label
						class="cell card-details"
						[name]="'app.arena.card-stats.header-card-name' | fsTranslate"
						[sort]="sort"
						[criteria]="'name'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell drawn-total"
						[name]="'app.arena.card-stats.header-drawn-total' | fsTranslate"
						[sort]="sort"
						[criteria]="'drawn-total'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell drawn-winrate"
						[name]="'app.arena.card-stats.header-drawn-winrate' | fsTranslate"
						[sort]="sort"
						[criteria]="'drawn-winrate'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
				</div>
				<virtual-scroller
					#scroll
					[items]="value.cards!"
					[bufferAmount]="25"
					role="list"
					class="cards-list"
					scrollable
				>
					<arena-card-stat-item
						*ngFor="let card of scroll.viewPortItems; trackBy: trackByFn"
						class="card-info"
						role="listitem"
						[card]="card"
					></arena-card-stat-item>
				</virtual-scroller>
			</section>
		</with-loading>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardStatsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	loading$: Observable<boolean>;
	cards$: Observable<ArenaCardStatInfo[]>;
	sortCriteria$: Observable<SortCriteria<ColumnSortType>>;

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortType>>({
		criteria: 'drawn-winrate',
		direction: 'desc',
	});

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly arenaCardStats: ArenaCardStatsService,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.arenaCardStats.isReady();

		console.debug('[arena-card-stats] after content init');
		this.sortCriteria$ = this.sortCriteria$$;
		this.cards$ = combineLatest([this.arenaCardStats.cardStats$$, this.sortCriteria$$]).pipe(
			tap((info) => console.debug('[arena-card-stats] received info', info)),
			this.mapData(([stats, sortCriteria]) => this.buildCardStats(stats, sortCriteria)),
			shareReplay(1),
			this.mapData((stats) => stats),
		);
		this.loading$ = this.cards$.pipe(
			startWith(true),
			tap((info) => console.debug('[arena-card-stats]] received info 2', info)),
			this.mapData((tiers) => tiers === null),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByFn(index, item: ArenaCardStatInfo) {
		return item.cardId;
	}

	private buildCardStats(
		stats: readonly ArenaCardStat[] | null | undefined,
		sortCriteria: SortCriteria<ColumnSortType>,
	): ArenaCardStatInfo[] {
		return (
			stats
				?.filter((stat) => stat.stats?.drawn > 100)
				?.map((stat) => this.buildCardStat(stat))
				.sort((a, b) => this.sortCards(a, b, sortCriteria)) ?? []
		);
		// .sort(sortByProperties((a: ArenaCardStatInfo) => [-(a.drawWinrate ?? 0)])) ?? []
	}

	private buildCardStat(stat: ArenaCardStat): ArenaCardStatInfo {
		return {
			cardId: stat.cardId,
			drawnTotal: stat.stats.drawn,
			drawWinrate: stat.stats.drawn > 0 ? stat.stats.drawnThenWin / stat.stats.drawn : null,
		};
	}

	onSortClick(rawCriteria: string) {
		const criteria: ColumnSortType = rawCriteria as ColumnSortType;
		this.sortCriteria$$.next({
			criteria: criteria,
			direction:
				criteria === this.sortCriteria$$.value?.criteria
					? invertDirection(this.sortCriteria$$.value.direction)
					: 'desc',
		});
	}

	private sortCards(a: ArenaCardStatInfo, b: ArenaCardStatInfo, sortCriteria: SortCriteria<ColumnSortType>): number {
		switch (sortCriteria?.criteria) {
			case 'name':
				return this.sortByName(a, b, sortCriteria.direction);
			case 'drawn-winrate':
				return this.sortByDrawnWinrate(a, b, sortCriteria.direction);
			case 'drawn-total':
				return this.sortByDrawnTotal(a, b, sortCriteria.direction);
			default:
				return 0;
		}
	}

	private sortByName(a: ArenaCardStatInfo, b: ArenaCardStatInfo, direction: SortDirection): number {
		const aData = this.allCards.getCard(a.cardId)?.name;
		const bData = this.allCards.getCard(b.cardId)?.name;
		return direction === 'asc' ? aData.localeCompare(bData) : bData.localeCompare(aData);
	}

	private sortByDrawnTotal(a: ArenaCardStatInfo, b: ArenaCardStatInfo, direction: SortDirection): number {
		const aData = a.drawnTotal ?? 0;
		const bData = b.drawnTotal ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private sortByDrawnWinrate(a: ArenaCardStatInfo, b: ArenaCardStatInfo, direction: SortDirection): number {
		const aData = a.drawWinrate ?? 0;
		const bData = b.drawWinrate ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}
}

type ColumnSortType = 'name' | 'drawn-total' | 'drawn-winrate';
