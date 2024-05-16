/* eslint-disable @angular-eslint/template/eqeqeq */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ALL_CLASSES } from '@firestone-hs/reference-data';
import { SortCriteria, SortDirection, invertDirection } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService, formatClass, waitForReady } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest, filter, shareReplay, startWith, takeUntil, tap } from 'rxjs';
import { ArenaRun } from '../../models/arena-run';
import { ArenaRunsService } from '../../services/arena-runs.service';
import { ArenaClassSummary } from './arena-personal-stats.model';

@Component({
	selector: 'arena-personal-stats',
	styleUrls: [`./arena-personal-stats-columns.scss`, `./arena-personal-stats.component.scss`],
	template: `
		<with-loading
			[isLoading]="loading$ | async"
			[attr.aria-label]="'Arena personal stats'"
			*ngIf="{
				runSummaries: runSummaries$ | async,
				total: total$ | async,
				runs: runs$ | async
			} as value"
		>
			<section class="arena-personal-stats-overview" [attr.aria-label]="'Arena stats overview'">
				<arena-personal-stats-overview [runs]="value.runs"></arena-personal-stats-overview>
			</section>
			<section class="arena-personal-stats-by-class" [attr.aria-label]="'Arena stats by class'">
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
					<sortable-table-label
						class="cell winrate"
						[name]="'app.arena.personal-stats.header-winrate' | fsTranslate"
						[sort]="sort"
						[criteria]="'winrate'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell winrate-first"
						[name]="'app.arena.personal-stats.header-winrate-first' | fsTranslate"
						[sort]="sort"
						[criteria]="'winrate-first'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell winrate-coin"
						[name]="'app.arena.personal-stats.header-winrate-coin' | fsTranslate"
						[sort]="sort"
						[criteria]="'winrate-coin'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
					<sortable-table-label
						class="cell time-played"
						[name]="'app.arena.personal-stats.header-time-played' | fsTranslate"
						[sort]="sort"
						[criteria]="'time-played'"
						(sortClick)="onSortClick($event)"
					>
					</sortable-table-label>
				</div>
				<div class="content" *ngIf="value.runSummaries as summaries">
					<div class="row" *ngFor="let summary of summaries" [ngClass]="{ empty: !summary.totalRuns }">
						<div class="cell class-name">
							<img class="class-icon" [src]="summary.classIcon" />
							<span class="class-name">{{ summary.className }}</span>
						</div>
						<div class="cell runs">{{ summary.totalRuns ?? '-' }}</div>
						<div class="cell average-wins {{ summary.averageWinsPerRunClass }}">
							{{ summary.averageWinsPerRun?.toFixed(2) ?? '-' }}
						</div>
						<div class="cell games-played">{{ summary.gamesPlayed || '-' }}</div>
						<div class="cell winrate {{ summary.winrateClass }}">
							{{ summary.winrateStr }}
						</div>
						<div class="cell winrate-first {{ summary.winrateFirstClass }}">
							{{ summary.winrateFirstStr }}
						</div>
						<div class="cell winrate-coin {{ summary.winrateCoinClass }}">
							{{ summary.winrateCoinStr }}
						</div>
						<div class="cell time-played">
							{{ summary.totalTimePlayedStr }}
						</div>
					</div>
					<div class="row total">
						<div class="cell class-name">
							<div class="class-icon"></div>
							<span class="class-name">{{ value.total?.className }}</span>
						</div>
						<div class="cell runs">{{ value.total?.totalRuns ?? '-' }}</div>
						<div class="cell average-wins {{ value.total?.averageWinsPerRunClass }}">
							{{ value.total?.averageWinsPerRun?.toFixed(2) ?? '-' }}
						</div>
						<div class="cell games-played">{{ value.total?.gamesPlayed ?? '-' }}</div>
						<div class="cell winrate {{ value.total?.winrateClass }}">
							{{ value.total?.winrateStr }}
						</div>
						<div class="cell winrate-first {{ value.total?.winrateFirstClass }}">
							{{ value.total?.winrateFirstStr }}
						</div>
						<div class="cell winrate-coin {{ value.total?.winrateCoinClass }}">
							{{ value.total?.winrateCoinStr }}
						</div>
						<div class="cell time-played">
							{{ value.total?.totalTimePlayedStr }}
						</div>
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
	runs$: Observable<readonly ArenaRun[] | undefined | null>;
	runSummaries$: Observable<readonly ArenaClassSummary[]>;
	total$: Observable<ArenaClassSummary>;

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortType>>({
		criteria: 'name',
		direction: 'asc',
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
		this.runs$ = this.arenaRuns.runs$$.pipe(
			this.mapData((runs) => runs),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.loading$ = this.runs$.pipe(
			startWith(true),
			tap((info) => console.debug('[arena-runs] received info', info)),
			this.mapData((runs) => runs === null),
		);
		const groupedRuns$ = this.runs$.pipe(
			filter((runs) => runs != null),
			this.mapData((runs) => {
				// TODO: how to handle runs that are in-progress?
				const grouped = groupByFunction(
					(run: ArenaRun) => this.allCards.getCard(run.heroCardId).classes?.[0]?.toLowerCase() ?? 'unknown',
				)(runs!);
				return ALL_CLASSES.map((playerClass) => {
					const runs = grouped[playerClass];
					const totalRuns = runs?.length;
					const totalGames = runs?.reduce((a, b) => a + b.wins + b.losses, 0) ?? 0;
					const totalWins = runs?.reduce((a, b) => a + b.wins, 0) ?? 0;
					const totalGamesFirst =
						runs?.flatMap((r) => r.steps).filter((s) => s.coinPlay === 'play').length ?? 0;
					const totalWinsFirst =
						runs?.flatMap((r) => r.steps).filter((s) => s.coinPlay === 'play' && s.result === 'won')
							.length ?? 0;
					const totalGamesCoin =
						runs?.flatMap((r) => r.steps).filter((s) => s.coinPlay === 'coin').length ?? 0;
					const totalWinsCoin =
						runs?.flatMap((r) => r.steps).filter((s) => s.coinPlay === 'coin' && s.result === 'won')
							.length ?? 0;
					const winrateStr = totalGames > 0 ? ((100 * totalWins) / totalGames).toFixed(2) + '%' : '-';
					const winrateFirstStr =
						totalGamesFirst > 0 ? ((100 * totalWinsFirst) / totalGamesFirst).toFixed(2) + '%' : '-';
					const winrateCoinStr =
						totalGamesCoin > 0 ? ((100 * totalWinsCoin) / totalGamesCoin).toFixed(2) + '%' : '-';
					const totalTimePlayed =
						runs?.flatMap((r) => r.steps).reduce((a, b) => a + b.gameDurationSeconds, 0) ?? 0;
					const summary: ArenaClassSummary = {
						className: formatClass(playerClass, this.i18n)!,
						classIcon: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${playerClass.toLowerCase()}.png`,
						totalRuns: totalRuns,
						averageWinsPerRun: !!totalRuns ? totalWins / totalRuns : null,
						averageWinsPerRunClass: !totalRuns
							? null
							: totalWins / totalRuns >= 4
							? 'positive'
							: totalWins / totalRuns <= 3
							? 'negative'
							: null,
						gamesPlayed: totalGames,
						winrateClass: !totalGames
							? null
							: (100 * totalWins) / totalGames > 51
							? 'positive'
							: (100 * totalWins) / totalGames < 49
							? 'negative'
							: null,
						winrateFirstClass: !totalGamesFirst
							? null
							: (100 * totalWinsFirst) / totalGamesFirst > 51
							? 'positive'
							: (100 * totalWinsFirst) / totalGamesFirst < 49
							? 'negative'
							: null,
						winrateCoinClass: !totalGamesCoin
							? null
							: (100 * totalWinsCoin) / totalGamesCoin > 51
							? 'positive'
							: (100 * totalWinsCoin) / totalGamesCoin < 49
							? 'negative'
							: null,
						winrateStr: winrateStr,
						winrateFirstStr: winrateFirstStr,
						winrateCoinStr: winrateCoinStr,
						totalWins: totalWins,
						totalGamesCoin: totalGamesCoin,
						totalWinsCoin: totalWinsCoin,
						totalGamesFirst: totalGamesFirst,
						totalWinsFirst: totalWinsFirst,
						totalTimePlayed: totalTimePlayed,
						totalTimePlayedStr: !totalTimePlayed
							? '-'
							: this.toAppropriateDurationFromSeconds(totalTimePlayed),
					};
					return summary;
				});
			}),
		);
		this.runSummaries$ = combineLatest([groupedRuns$, this.sortCriteria$$]).pipe(
			this.mapData(([groupedRuns, sortCriteria]) => {
				return groupedRuns.sort((a, b) => this.sortCards(a, b, sortCriteria));
			}),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		this.total$ = this.runSummaries$.pipe(
			this.mapData((summaries) => {
				const totalRuns = summaries.reduce((a, b) => a + (b.totalRuns ?? 0), 0);
				const totalWins = summaries.reduce((a, b) => a + (b.totalWins ?? 0), 0);
				const totalGames = summaries.reduce((a, b) => a + (b.gamesPlayed ?? 0), 0);
				const totalGamesCoin = summaries.reduce((a, b) => a + (b.totalGamesCoin ?? 0), 0);
				const totalWinsCoin = summaries.reduce((a, b) => a + (b.totalWinsCoin ?? 0), 0);
				const totalGamesFirst = summaries.reduce((a, b) => a + (b.totalGamesFirst ?? 0), 0);
				const totalWinsFirst = summaries.reduce((a, b) => a + (b.totalWinsFirst ?? 0), 0);
				const totalTimePlayed = summaries.reduce((a, b) => a + b.totalTimePlayed, 0);
				const result: ArenaClassSummary = {
					classIcon: null,
					className: this.i18n.translateString('app.decktracker.matchup-info.total-header')!,
					totalRuns: totalRuns,
					gamesPlayed: totalGames,
					averageWinsPerRun: totalRuns > 0 ? totalWins / totalRuns : null,
					averageWinsPerRunClass: !totalRuns
						? null
						: totalWins / totalRuns >= 4
						? 'positive'
						: totalWins / totalRuns <= 3
						? 'negative'
						: null,
					totalWins: totalWins,
					totalGamesCoin: totalGamesCoin,
					totalWinsCoin: totalWinsCoin,
					totalGamesFirst: totalGamesFirst,
					totalWinsFirst: totalWinsFirst,
					winrateClass: !totalGames
						? null
						: (100 * totalWins) / totalGames > 51
						? 'positive'
						: (100 * totalWins) / totalGames < 49
						? 'negative'
						: null,
					winrateFirstClass: !totalGamesFirst
						? null
						: (100 * totalWinsFirst) / totalGamesFirst > 51
						? 'positive'
						: (100 * totalWinsFirst) / totalGamesFirst < 49
						? 'negative'
						: null,
					winrateCoinClass: !totalGamesCoin
						? null
						: (100 * totalWinsCoin) / totalGamesCoin > 51
						? 'positive'
						: (100 * totalWinsCoin) / totalGamesCoin < 49
						? 'negative'
						: null,
					winrateStr: totalGames > 0 ? ((100 * totalWins) / totalGames).toFixed(2) + '%' : '-',
					winrateFirstStr:
						totalGamesFirst > 0 ? ((100 * totalWinsFirst) / totalGamesFirst).toFixed(2) + '%' : '-',
					winrateCoinStr:
						totalGamesCoin > 0 ? ((100 * totalWinsCoin) / totalGamesCoin).toFixed(2) + '%' : '-',
					totalTimePlayed: totalTimePlayed,
					totalTimePlayedStr: !totalTimePlayed ? '-' : this.toAppropriateDurationFromSeconds(totalTimePlayed),
				};
				return result;
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

	private toAppropriateDurationFromSeconds(durationInSeconds: number): string {
		if (durationInSeconds < 60) {
			return this.i18n.translateString('global.duration.sec', { sec: durationInSeconds })!;
		} else if (durationInSeconds < 3600) {
			return this.i18n.translateString('global.duration.min', { min: Math.round(durationInSeconds / 60) })!;
			// } else if (durationInSeconds < 3600 * 24) {
		} else {
			const hours = Math.floor(durationInSeconds / 3600);
			const min = Math.floor((durationInSeconds - 3600 * hours) / 60);
			return this.i18n.translateString('global.duration.hrs-min', {
				hrs: hours.toLocaleString(),
				min: min.toLocaleString().padStart(2, '0'),
			})!;
		}
	}
}

type ColumnSortType = 'name' | 'runs' | 'average-wins' | 'total-games';
