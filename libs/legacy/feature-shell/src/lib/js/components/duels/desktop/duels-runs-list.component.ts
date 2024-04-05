import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnDestroy,
	ViewChild,
	ViewRef,
} from '@angular/core';
import { DuelsRun } from '@firestone/duels/general';
import { PatchesConfigService } from '@firestone/shared/common/service';
import { VirtualScrollerComponent } from 'ngx-virtual-scroller';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { filterDuelsRuns } from '../../../services/ui-store/duels-ui-helper';
import { groupByFunction } from '../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'duels-runs-list',
	styleUrls: [`../../../../css/component/duels/desktop/duels-runs-list.component.scss`],
	template: `
		<div class="duels-runs-container">
			<ng-container *ngIf="{ runs: runs$ | async, expandedRunIds: expandedRunIds$ | async } as value">
				<virtual-scroller
					#scroll
					*ngIf="value.runs?.length; else emptyState"
					class="runs-list"
					[items]="value.runs"
					[bufferAmount]="5"
					scrollable
				>
					<!-- Because the virtual-scroller needs elements of the same size to work, we can't give it groups -->
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
				</virtual-scroller>

				<ng-template #emptyState>
					<duels-empty-state></duels-empty-state>
				</ng-template>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsRunsListComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit, OnDestroy {
	@ViewChild('scroll', { static: false })
	private scroll: VirtualScrollerComponent;

	runs$: Observable<(DuelsRun | HeaderInfo)[]>;
	expandedRunIds$: Observable<readonly string[]>;

	@Input() set deckstring(value: string) {
		this.deckstring$.next(value);
	}
	@Input() displayLoot = true;
	@Input() displayShortLoot = false;

	private deckstring$: BehaviorSubject<string> = new BehaviorSubject<string>(null);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly patchesConfig: PatchesConfigService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.patchesConfig.isReady();

		this.expandedRunIds$ = this.store
			.listen$(([main, nav]) => nav.navigationDuels.expandedRunIds)
			.pipe(this.mapData(([expandedRunIds]) => expandedRunIds));
		this.runs$ = combineLatest(
			this.store.duelsRuns$(),
			this.store.listen$(
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveHeroesFilter2,
				([main, nav, prefs]) => prefs.duelsActiveGameModeFilter,
				([main, nav, prefs]) => prefs.duelsDeckDeletes,
			),
			this.patchesConfig.currentDuelsMetaPatch$$,
			this.deckstring$.asObservable(),
		).pipe(
			map(([runs, [timeFilter, classFilter, gameMode, duelsDeckDeletes], patch, deckstring]) => {
				if (!runs?.length) {
					return null;
				}

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
				return !!flat?.length ? flat : null;
			}),
			tap((filter) => {
				// FIXME: it is necessary to call scroll.refresh(), but I don't know why
				// Maybe upgrade the lib to its latest version?
				setTimeout(() => {
					this.scroll?.refresh();
					if (!(this.cdr as ViewRef)?.destroyed) {
						this.cdr.detectChanges();
					}
				}, 0);
				setTimeout(() => {
					this.scroll?.refresh();
					if (!(this.cdr as ViewRef)?.destroyed) {
						this.cdr.detectChanges();
					}
				}, 500);
			}),
			takeUntil(this.destroyed$),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
