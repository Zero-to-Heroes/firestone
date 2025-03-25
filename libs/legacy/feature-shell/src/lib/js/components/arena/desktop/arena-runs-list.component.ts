import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { HeaderInfo } from '@components/replays/replays-list-view.component';
import { ArenaRun, ArenaRunsService } from '@firestone/arena/common';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { groupByFunction } from '../../../services/utils';

@Component({
	selector: 'arena-runs-list',
	styleUrls: [`../../../../css/component/arena/desktop/arena-runs-list.component.scss`],
	template: `
		<div class="arena-runs-container">
			<ng-container *ngIf="{ runs: runs$ | async } as value">
				<virtual-scroller
					#scroll
					*ngIf="value.runs?.length; else emptyState"
					class="runs-list"
					[items]="value.runs"
					scrollable
				>
					<ng-container *ngFor="let run of scroll.viewPortItems; trackBy: trackByRun">
						<div class="header" *ngIf="run.header">{{ run.header }}</div>
						<arena-run *ngIf="!run.header" [run]="run"></arena-run>
					</ng-container>
				</virtual-scroller>
			</ng-container>

			<ng-template #emptyState>
				<arena-empty-state></arena-empty-state>
			</ng-template>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaRunsListComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	runs$: Observable<(ArenaRun | HeaderInfo)[]>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly arenaRuns: ArenaRunsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.arenaRuns);

		this.runs$ = this.arenaRuns.runs$$.pipe(
			this.mapData((arenaRuns) => {
				console.debug('[arena-runs-list] received runs', arenaRuns);
				const groupedRuns = this.groupRuns(arenaRuns);
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

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackByRun(index: number, item: ArenaRun) {
		return item.id;
	}

	private groupRuns(runs: readonly ArenaRun[]): readonly GroupedRun[] {
		const groupingFunction = (run: ArenaRun) => {
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
	readonly runs: readonly ArenaRun[];
}
