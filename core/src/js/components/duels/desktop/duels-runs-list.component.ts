import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnDestroy,
} from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DuelsRun } from '../../../models/duels/duels-run';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { filterDuelsRuns } from '../../../services/ui-store/duels-ui-helper';
import { groupByFunction } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'duels-runs-list',
	styleUrls: [`../../../../css/component/duels/desktop/duels-runs-list.component.scss`],
	template: `
		<div class="duels-runs-container">
			<virtual-scroller
				#scroll
				*ngIf="runs$ | async as runs; else emptyState"
				class="runs-list"
				[items]="runs"
				bufferAmount="5"
				scrollable
			>
				<!-- Because the virtual-scroller needs elements of the same size to work, we can't give it groups -->
				<ng-container *ngIf="{ expandedRunIds: expandedRunIds$ | async } as value">
					<ng-container *ngFor="let run of scroll.viewPortItems; trackBy: trackByRun">
						<div class="header" *ngIf="run.header">{{ run.header }}</div>
						<duels-run
							*ngIf="!run.header"
							[run]="run"
							[displayLoot]="displayLoot"
							[displayShortLoot]="displayShortLoot"
							[isExpanded]="value.expandedRunIds?.includes(run.id)"
						></duels-run>
					</ng-container>
				</ng-container>
			</virtual-scroller>

			<ng-template #emptyState>
				<duels-empty-state></duels-empty-state>
			</ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsRunsListComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	runs$: Observable<readonly (DuelsRun | HeaderInfo)[]>;
	expandedRunIds$: Observable<readonly string[]>;

	@Input() set deckstring(value: string) {
		this.deckstring$.next(value);
	}
	@Input() displayLoot = true;
	@Input() displayShortLoot = false;

	private deckstring$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

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
		this.runs$ = combineLatest(
			this.store.listen$(
				([main, nav]) => main.duels.runs,
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveHeroesFilter2,
				([main, nav, prefs]) => prefs.duelsActiveGameModeFilter,
				([main, nav, prefs]) => prefs.duelsDeckDeletes,
				([main, nav, prefs]) => main.duels.currentDuelsMetaPatch,
				// TODO: MMR filter
			),
			this.deckstring$.asObservable(),
		).pipe(
			filter(
				([[runs, timeFilter, classFilter, gameMode, duelsDeckDeletes, patch], deckstring]) => !!runs?.length,
			),
			this.mapData(([[runs, timeFilter, classFilter, gameMode, duelsDeckDeletes, patch], deckstring]) => {
				const filteredRuns = filterDuelsRuns(
					runs,
					timeFilter,
					classFilter,
					gameMode,
					duelsDeckDeletes,
					patch,
					0,
				);
				const runsForDeckstring = !deckstring?.length
					? filteredRuns
					: filteredRuns.filter((run) => run.initialDeckList === deckstring);
				const groupedRuns = this.groupRuns(runsForDeckstring);
				const flat = groupedRuns
					.filter((group) => group?.runs?.length)
					.flatMap((group) => {
						return [
							{
								header: group.header,
							} as HeaderInfo,
							...group.runs,
						];
					});
				return flat;
			}),
		);
	}

	trackByRun(index: number, item: DuelsRun | HeaderInfo): string {
		return (item as DuelsRun).id ?? (item as HeaderInfo)?.header;
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

interface HeaderInfo {
	header: string;
}
