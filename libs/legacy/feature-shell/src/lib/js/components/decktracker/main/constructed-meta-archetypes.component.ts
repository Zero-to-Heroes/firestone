import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { ArchetypeStat } from '@firestone-hs/constructed-deck-stats';
import { ConstructedMetaDecksStateService, buildArchetypeName } from '@firestone/constructed/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { SortCriteria, SortDirection, invertDirection } from '@firestone/shared/common/view';
import { AbstractSubscriptionComponent, arraysEqual } from '@firestone/shared/framework/common';
import { getDateAgo } from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { formatGamesCount } from './constructed-meta-decks.component';

@Component({
	selector: 'constructed-meta-archetypes',
	styleUrls: [
		`../../../../css/component/decktracker/main/constructed-meta-archetypes-columns.scss`,
		`../../../../css/component/decktracker/main/constructed-meta-archetypes.component.scss`,
	],
	template: `
		<ng-container
			*ngIf="{
				archetypes: archetypes$ | async,
				showStandardDeviation: showStandardDeviation$ | async,
				lastUpdate: lastUpdate$ | async,
				totalGames: totalGames$ | async
			} as value"
		>
			<with-loading [isLoading]="!value.archetypes">
				<div class="constructed-meta-archetypes">
					<div class="data-info">
						<div class="label" [fsTranslate]="'app.decktracker.meta.last-updated'"></div>
						<div class="value" [helpTooltip]="lastUpdateFull$ | async">{{ value.lastUpdate }}</div>
						<div class="separator">-</div>
						<div class="label" [fsTranslate]="'app.decktracker.meta.total-games'"></div>
						<div class="value">{{ value.totalGames }}</div>
					</div>
					<div class="header" *ngIf="sortCriteria$ | async as sort">
						<sortable-table-label
							class="cell player-class"
							[name]="'app.decktracker.meta.class-header' | owTranslate"
							[sort]="sort"
							[criteria]="'player-class'"
							(sortClick)="onSortClick($event)"
						>
						</sortable-table-label>
						<sortable-table-label
							class="cell name"
							[name]="'app.decktracker.meta.archetype-header' | owTranslate"
							[sort]="sort"
							[criteria]="'name'"
							(sortClick)="onSortClick($event)"
						>
						</sortable-table-label>
						<sortable-table-label
							class="cell winrate"
							[name]="'app.decktracker.meta.winrate-header' | owTranslate"
							[sort]="sort"
							[criteria]="'winrate'"
							(sortClick)="onSortClick($event)"
						>
						</sortable-table-label>
						<sortable-table-label
							class="cell games"
							[name]="'app.decktracker.meta.games-header' | owTranslate"
							[sort]="sort"
							[criteria]="'games'"
							(sortClick)="onSortClick($event)"
						>
						</sortable-table-label>
						<div class="cell cards">
							<span
								[owTranslate]="'app.decktracker.meta.core-cards-header'"
								[helpTooltip]="'app.decktracker.meta.core-cards-header-tooltip' | owTranslate"
							></span>
						</div>
					</div>
					<virtual-scroller
						#scroll
						class="archetypes-list"
						[items]="value.archetypes"
						[bufferAmount]="15"
						[attr.aria-label]="'Meta archetype stats'"
						role="list"
						scrollable
					>
						<constructed-meta-archetype
							*ngFor="let archetype of scroll.viewPortItems; trackBy: trackByArchetype"
							class="archetype"
							role="listitem"
							[archetype]="archetype"
							[showStandardDeviation]="value.showStandardDeviation"
						></constructed-meta-archetype>
					</virtual-scroller>
				</div>
			</with-loading>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaArchetypesComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	sortCriteria$: Observable<SortCriteria<ColumnSortType>>;
	archetypes$: Observable<EnhancedArchetypeStat[]>;
	showStandardDeviation$: Observable<boolean>;
	lastUpdate$: Observable<string>;
	lastUpdateFull$: Observable<string>;
	totalGames$: Observable<string>;

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortType>>({
		criteria: 'games',
		direction: 'desc',
	});

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly constructedMetaStats: ConstructedMetaDecksStateService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.constructedMetaStats.isReady();
		await this.prefs.isReady();

		this.sortCriteria$ = this.sortCriteria$$.asObservable();
		this.showStandardDeviation$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => !prefs.constructedMetaDecksUseConservativeWinrate),
		);
		this.archetypes$ = combineLatest([
			this.sortCriteria$$,
			this.constructedMetaStats.constructedMetaArchetypes$$,
			this.prefs.preferences$$.pipe(
				this.mapData((prefs) => ({
					useConservativeEstimate: prefs.constructedMetaDecksUseConservativeWinrate,
					sampleSize: prefs.constructedMetaArchetypesSampleSizeFilter,
					playerClasses: prefs.constructedMetaDecksPlayerClassFilter,
					archetypes: prefs.constructedMetaDecksArchetypeFilter,
				})),
				distinctUntilChanged(
					(a, b) =>
						a.useConservativeEstimate === b.useConservativeEstimate &&
						a.sampleSize === b.sampleSize &&
						arraysEqual(a.playerClasses, b.playerClasses) &&
						arraysEqual(a.archetypes, b.archetypes),
				),
			),
		]).pipe(
			filter(([sortCriteria, stats, { useConservativeEstimate, sampleSize }]) => !!stats?.dataPoints),
			this.mapData(([sortCriteria, stats, { useConservativeEstimate, sampleSize, playerClasses, archetypes }]) =>
				stats.archetypeStats
					.filter((a) => a.totalGames >= sampleSize)
					.filter((stat) => !playerClasses?.length || playerClasses.includes(stat.heroCardClass))
					.filter((stat) => !archetypes?.length || archetypes.includes(stat.id))
					.map((a) => ({
						...a,
						totalGames: formatGamesCount(a.totalGames),
						name: buildArchetypeName(a.name, this.i18n),
					}))
					.map((stat) => this.enhanceStat(stat, useConservativeEstimate))
					.sort((a, b) => this.sortArchetypes(a, b, sortCriteria)),
			),
		);
		this.totalGames$ = this.constructedMetaStats.constructedMetaArchetypes$$.pipe(
			filter((stats) => !!stats),
			this.mapData((stats) => stats.dataPoints.toLocaleString(this.i18n.formatCurrentLocale())),
			takeUntil(this.destroyed$),
		);
		this.lastUpdate$ = this.constructedMetaStats.constructedMetaArchetypes$$.pipe(
			this.mapData((stats) => {
				if (!stats?.lastUpdated) {
					return null;
				}
				// Show the date as a relative date, unless it's more than 1 week old
				// E.g. "2 hours ago", "3 days ago", "1 week ago", "on 12/12/2020"
				const date = new Date(stats.lastUpdated);
				const now = new Date();
				const diff = now.getTime() - date.getTime();
				const days = diff / (1000 * 3600 * 24);
				if (days < 7) {
					return getDateAgo(date, this.i18n);
				}
				return date.toLocaleDateString(this.i18n.formatCurrentLocale());
			}),
		);
		this.lastUpdateFull$ = this.constructedMetaStats.constructedMetaArchetypes$$.pipe(
			this.mapData((stats) => {
				if (!stats?.lastUpdated) {
					return null;
				}
				const date = new Date(stats.lastUpdated);
				return date.toLocaleDateString(this.i18n.formatCurrentLocale(), {
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
		const criteria: ColumnSortType = rawCriteria as ColumnSortType;
		this.sortCriteria$$.next({
			criteria: criteria,
			direction:
				criteria === this.sortCriteria$$.value?.criteria
					? invertDirection(this.sortCriteria$$.value.direction)
					: 'desc',
		});
	}

	trackByArchetype(index: number, item: ArchetypeStat) {
		return item.id;
	}

	private enhanceStat(stat: ArchetypeStat, conservativeEstimate: boolean): EnhancedArchetypeStat {
		const standardDeviation = Math.sqrt((stat.winrate * (1 - stat.winrate)) / stat.totalGames);
		const conservativeWinrate: number = stat.winrate - 3 * standardDeviation;
		const winrateToUse = conservativeEstimate ? conservativeWinrate : stat.winrate;
		return {
			...stat,
			rawWinrate: stat.winrate,
			standardDeviation: standardDeviation,
			conservativeWinrate: conservativeWinrate,
			winrate: winrateToUse,
		};
	}

	private sortArchetypes(a: ArchetypeStat, b: ArchetypeStat, sortCriteria: SortCriteria<ColumnSortType>): number {
		switch (sortCriteria?.criteria) {
			case 'name':
				return this.sortByArchetype(a, b, sortCriteria.direction);
			case 'winrate':
				return this.sortByWinrate(a, b, sortCriteria.direction);
			case 'games':
				return this.sortByGames(a, b, sortCriteria.direction);
			default:
				return 0;
		}
	}

	private sortByArchetype(a: ArchetypeStat, b: ArchetypeStat, direction: SortDirection): number {
		return direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
	}

	private sortByWinrate(a: ArchetypeStat, b: ArchetypeStat, direction: SortDirection): number {
		return direction === 'asc' ? a.winrate - b.winrate : b.winrate - a.winrate;
	}

	private sortByGames(a: ArchetypeStat, b: ArchetypeStat, direction: SortDirection): number {
		return direction === 'asc' ? a.totalGames - b.totalGames : b.totalGames - a.totalGames;
	}
}

export type ColumnSortType = 'name' | 'winrate' | 'games';

export interface EnhancedArchetypeStat extends ArchetypeStat {
	readonly rawWinrate: number;
	readonly standardDeviation: number;
	readonly conservativeWinrate: number;
}
