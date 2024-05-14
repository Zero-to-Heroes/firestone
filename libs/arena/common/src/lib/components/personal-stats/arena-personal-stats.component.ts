/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { SortCriteria, SortDirection, invertDirection } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, formatClass, waitForReady } from '@firestone/shared/framework/core';
import { classes } from '@legacy-import/src/lib/js/services/hs-utils';
import { BehaviorSubject, Observable, combineLatest, filter, shareReplay, startWith, takeUntil, tap } from 'rxjs';
import { ArenaRun } from '../../models/arena-run';
import { ArenaRunsService } from '../../services/arena-runs.service';
import { ArenaClassSummary } from './arena-personal-stats.model';

@Component({
	selector: 'arena-personal-stats',
	styleUrls: [`./arena-personal-stats-columns.scss`, `./arena-personal-stats.component.scss`],
	template: `
		<with-loading [isLoading]="loading$ | async">
			<section class="arena-personal-stats" [attr.aria-label]="'Arena personal stats'">
				<div class="header" *ngIf="sortCriteria$ | async as sort">
					<sortable-table-label
						class="cell class-name"
						[name]="'app.arena.personal-stats.header-class-name' | fsTranslate"
						[sort]="sort"
						[criteria]="'name'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell runs"
						[name]="'app.arena.personal-stats.header-runs' | fsTranslate"
						[sort]="sort"
						[criteria]="'runs'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell average-wins"
						[name]="'app.arena.personal-stats.header-average-wins' | fsTranslate"
						[sort]="sort"
						[criteria]="'average-wins'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell games-played"
						[name]="'app.arena.personal-stats.header-games-played' | fsTranslate"
						[sort]="sort"
						[criteria]="'total-games'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
				</div>
				<div class="content" *ngIf="runSummaries$ | async as summaries">
					<div class="row" *ngFor="let summary of summaries" [ngClass]="{ empty: !summary.totalRuns }">
						<div class="cell class-name">
							<img class="class-icon" [src]="summary.classIcon" />
							<span class="class-name">{{ summary.className }}</span>
						</div>
						<div class="cell runs">{{ summary.totalRuns ?? '-' }}</div>
						<div class="cell average-wins">{{ summary.averageWinsPerRun?.toFixed(2) ?? '-' }}</div>
						<div class="cell games-played">{{ summary.gamesPlayed ?? '-' }}</div>
					</div>
				</div>
			</section>
		</with-loading>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaPersonalStatsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	loading$: Observable<boolean>;
	sortCriteria$: Observable<SortCriteria<ColumnSortType>>;
	runSummaries$: Observable<readonly ArenaClassSummary[]>;

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortType>>({
		criteria: 'name',
		direction: 'desc',
	});

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly arenaRuns: ArenaRunsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.arenaRuns);

		console.debug('[arena-card-stats] after content init');
		this.sortCriteria$ = this.sortCriteria$$;
		const runs$ = this.arenaRuns.runs$$.pipe(
			this.mapData((runs) => runs),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.loading$ = runs$.pipe(
			startWith(true),
			tap((info) => console.debug('[arena-runs] received info', info)),
			this.mapData((runs) => runs === null),
		);
		const groupedRuns$ = runs$.pipe(
			filter((runs) => runs != null),
			this.mapData((runs) => {
				// TODO: how to handle runs that are in-progress?
				const grouped = groupByFunction(
					(run: ArenaRun) => this.allCards.getCard(run.heroCardId).classes?.[0]?.toLowerCase() ?? 'unknown',
				)(runs!);
				return classes.map((playerClass) => {
					const runs = grouped[playerClass];
					const totalRuns = runs?.length;
					const summary: ArenaClassSummary = {
						className: formatClass(playerClass, this.i18n)!,
						classIcon: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${playerClass.toLowerCase()}.png`,
						totalRuns: totalRuns,
						averageWinsPerRun: !!totalRuns ? runs.reduce((a, b) => a + b.wins, 0) / totalRuns : null,
						gamesPlayed: runs?.reduce((a, b) => a + b.wins + b.losses, 0),
					};
					return summary;
				});
			}),
		);
		this.runSummaries$ = combineLatest([groupedRuns$, this.sortCriteria$$]).pipe(
			this.mapData(([groupedRuns, sortCriteria]) => {
				return groupedRuns.sort((a, b) => this.sortCards(a, b, sortCriteria));
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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

	private sortCards(a: ArenaClassSummary, b: ArenaClassSummary, sortCriteria: SortCriteria<ColumnSortType>): number {
		switch (sortCriteria?.criteria) {
			case 'name':
				return this.sortByName(a, b, sortCriteria.direction);
			case 'runs':
				return this.sortByRuns(a, b, sortCriteria.direction);
			case 'average-wins':
				return this.sortByAverageWins(a, b, sortCriteria.direction);
			case 'total-games':
				return this.sortByTotalGames(a, b, sortCriteria.direction);
			default:
				return 0;
		}
	}

	private sortByTotalGames(a: ArenaClassSummary, b: ArenaClassSummary, direction: SortDirection): number {
		const aData = a.gamesPlayed ?? 0;
		const bData = b.gamesPlayed ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private sortByAverageWins(a: ArenaClassSummary, b: ArenaClassSummary, direction: SortDirection): number {
		const aData = a.averageWinsPerRun ?? 0;
		const bData = b.averageWinsPerRun ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private sortByRuns(a: ArenaClassSummary, b: ArenaClassSummary, direction: SortDirection): number {
		const aData = a.totalRuns ?? 0;
		const bData = b.totalRuns ?? 0;
		return direction === 'asc' ? aData - bData : bData - aData;
	}

	private sortByName(a: ArenaClassSummary, b: ArenaClassSummary, direction: SortDirection): number {
		const aData = a.className;
		const bData = b.className;
		return direction === 'asc' ? aData.localeCompare(bData) : bData.localeCompare(aData);
	}
}

type ColumnSortType = 'name' | 'runs' | 'average-wins' | 'total-games';
