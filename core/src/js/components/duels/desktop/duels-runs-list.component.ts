import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { DuelsRun } from '../../../models/duels/duels-run';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../../services/ui-store/app-ui-store.service';
import { filterDuelsRuns } from '../../../services/ui-store/duels-ui-helper';
import { groupByFunction } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'duels-runs-list',
	styleUrls: [`../../../../css/component/duels/desktop/duels-runs-list.component.scss`],
	template: `
		<div class="duels-runs-container">
			<infinite-scroll *ngIf="allRuns?.length" class="runs-list" (scrolled)="onScroll()" scrollable>
				<ng-container *ngIf="{ expandedRunIds: expandedRunIds$ | async } as value">
					<li
						*ngFor="let groupedRun of displayedGroupedRuns; trackBy: trackByGroupedRun"
						class="grouped-runs"
					>
						<div class="header">{{ groupedRun.header }}</div>
						<ul class="runs">
							<duels-run
								*ngFor="let run of groupedRun.runs; trackBy: trackByRun"
								[run]="run"
								[displayLoot]="displayLoot"
								[displayShortLoot]="displayShortLoot"
								[isExpanded]="value.expandedRunIds?.includes(run.id)"
							></duels-run>
						</ul>
					</li>
				</ng-container>
				<div class="loading" *ngIf="isLoading" [owTranslate]="'app.duels.run.load-more-button'"></div>
			</infinite-scroll>
			<duels-empty-state *ngIf="!allRuns?.length"></duels-empty-state>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsRunsListComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	// https://stackoverflow.com/a/52436938/548701
	@Input() set deckstring(value: string) {
		this.deckstring$.next(value);
	}
	@Input() displayLoot = true;
	@Input() displayShortLoot = false;

	expandedRunIds$: Observable<readonly string[]>;

	isLoading: boolean;
	allRuns: readonly DuelsRun[] = [];
	displayedGroupedRuns: readonly GroupedRun[] = [];

	_deckstring: string;

	private deckstring$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
	private sub$$: Subscription;
	private displayedRuns: readonly DuelsRun[] = [];
	private runsIterator: IterableIterator<void>;

	constructor(
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.expandedRunIds$ = this.store
			.listen$(([main, nav]) => nav.navigationDuels.expandedRunIds)
			.pipe(this.mapData(([expandedRunIds]) => expandedRunIds));
		this.sub$$ = combineLatest(
			this.store
				.listen$(
					([main, nav]) => main.duels.runs,
					([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
					([main, nav, prefs]) => prefs.duelsActiveHeroesFilter,
					([main, nav, prefs]) => prefs.duelsActiveGameModeFilter,
					([main, nav, prefs]) => main.duels.currentDuelsMetaPatch,
					// TODO: MMR filter
				)
				.pipe(
					filter(([runs, timeFilter, classFilter, gameMode, patch]) => !!runs?.length),
					map(([runs, timeFilter, classFilter, gameMode, patch]) =>
						filterDuelsRuns(runs, timeFilter, classFilter, gameMode, patch, 0),
					),
					takeUntil(this.destroyed$),
				),
			this.deckstring$.asObservable(),
		)
			.pipe(
				map(([runs, deckstring]) =>
					!deckstring?.length ? runs : runs.filter((run) => run.initialDeckList === deckstring),
				),
				tap((stat) => cdLog('emitting in ', this.constructor.name, stat)),
				takeUntil(this.destroyed$),
			)
			.subscribe((runs) => {
				// Otherwise the generator is simply closed at the end of the first onScroll call
				setTimeout(() => {
					this.displayedRuns = [];
					this.displayedGroupedRuns = [];
					this.runsIterator = this.buildIterator(runs, 8);
					this.onScroll();
				});
			});
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
		this.sub$$?.unsubscribe();
	}

	onScroll() {
		this.runsIterator && this.runsIterator.next();
	}

	trackByGroupedRun(index: number, item: GroupedRun) {
		return item.header;
	}

	trackByRun(index: number, item: DuelsRun) {
		return item.id;
	}

	private *buildIterator(runs: readonly DuelsRun[], step = 40): IterableIterator<void> {
		this.allRuns = runs;
		const workingRuns = [...this.allRuns];
		while (workingRuns.length > 0) {
			const currentRuns = [];
			while (workingRuns.length > 0 && currentRuns.length < step) {
				currentRuns.push(...workingRuns.splice(0, 1));
			}
			this.displayedRuns = [...this.displayedRuns, ...currentRuns];
			this.displayedGroupedRuns = this.groupRuns(this.displayedRuns);
			this.isLoading = this.allRuns.length > step;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			yield;
		}
		this.isLoading = false;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		return;
	}

	private groupRuns(runs: readonly DuelsRun[]): readonly GroupedRun[] {
		const groupingFunction = (run: DuelsRun) => {
			const date = new Date(run.creationTimestamp);
			return date.toLocaleDateString(this.i18n.formatCurrentLocale(), {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			});
		};
		const groupByDate = groupByFunction(groupingFunction);
		const runsByDate = groupByDate(runs);
		return Object.keys(runsByDate).map((date) => ({
			header: date,
			runs: runsByDate[date],
		}));
	}
}

interface GroupedRun {
	readonly header: string;
	readonly runs: readonly DuelsRun[];
}
