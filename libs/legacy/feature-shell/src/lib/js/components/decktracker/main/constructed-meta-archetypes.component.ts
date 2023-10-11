import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ArchetypeStat } from '@firestone-hs/constructed-deck-stats';
import { SortCriteria, SortDirection, invertDirection } from '@firestone/shared/common/view';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';
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
				showStandardDeviation: showStandardDeviation$ | async
			} as value"
		>
			<div class="constructed-meta-archetypes" *ngIf="value.archetypes">
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
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaArchetypesComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	sortCriteria$: Observable<SortCriteria<ColumnSortType>>;
	archetypes$: Observable<EnhancedArchetypeStat[]>;
	showStandardDeviation$: Observable<boolean>;

	private sortCriteria$$ = new BehaviorSubject<SortCriteria<ColumnSortType>>({
		criteria: 'winrate',
		direction: 'desc',
	});

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.sortCriteria$ = this.sortCriteria$$.asObservable();
		this.showStandardDeviation$ = this.listenForBasicPref$(
			(prefs) => !prefs.constructedMetaDecksUseConservativeWinrate,
		);
		this.archetypes$ = combineLatest([
			this.sortCriteria$$,
			this.store.constructedMetaDecks$(),
			this.store.listenPrefs$(
				(prefs) => prefs.constructedMetaDecksUseConservativeWinrate,
				(prefs) => prefs.constructedMetaArchetypesSampleSizeFilter,
				(prefs) => prefs.constructedMetaDecksPlayerClassFilter,
			),
		]).pipe(
			filter(([sortCriteria, stats, [useConservativeEstimate, sampleSize]]) => !!stats?.dataPoints),
			this.mapData(([sortCriteria, stats, [useConservativeEstimate, sampleSize, playerClasses]]) =>
				stats.archetypeStats
					.filter((a) => a.totalGames >= sampleSize)
					.filter((stat) => !playerClasses?.length || playerClasses.includes(stat.heroCardClass))
					.map((a) => ({
						...a,
						totalGames: formatGamesCount(a.totalGames),
						name:
							this.i18n.translateString(`archetype.${a.name}`) === `archetype.${a.name}`
								? a.name
								: this.i18n.translateString(`archetype.${a.name}`),
					}))
					.map((stat) => this.enhanceStat(stat, useConservativeEstimate))
					.sort((a, b) => this.sortArchetypes(a, b, sortCriteria)),
			),
		);
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
