import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { ArenaRunInfo, HighWinRunsInfo } from '@firestone-hs/arena-high-win-runs';
import { AbstractSubscriptionComponent, groupByFunction } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { ArenaGroupedRuns } from '../../models/arena-high-wins-runs';
import { ArenaHighWinsRunsService } from '../../services/arena-high-wins-runs.service';

@Component({
	selector: 'arena-high-wins-runs',
	styleUrls: [`./arena-high-wins-runs.component.scss`],
	template: `
		<ng-container
			*ngIf="{
				runGroups: runGroups$ | async
			} as value"
		>
			<div class="runs-container">
				<with-loading [isLoading]="value.runGroups === null">
					<virtual-scroller
						#scroll
						*ngIf="value.runGroups?.length"
						class="runs-list"
						[items]="value.runGroups ?? []"
						[bufferAmount]="10"
						[attr.aria-label]="'Arena recent runs that went 10+ wins'"
						role="list"
						scrollable
					>
						<ng-container *ngFor="let stat of scroll.viewPortItems; trackBy: trackByGroup">
							<div class="header" *ngIf="!stat.creationDate">{{ stat }}</div>
							<arena-run-vignette *ngIf="stat.creationDate" [stat]="stat"></arena-run-vignette>
						</ng-container>
					</virtual-scroller>
					<!-- <duels-empty-state *ngIf="!value.runGroups?.length"></duels-empty-state> -->
				</with-loading>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaHighWinsRunsComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	runGroups$: Observable<(ArenaRunInfo | string)[] | null>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly runsService: ArenaHighWinsRunsService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.runsService.isReady();

		this.runGroups$ = this.runsService.runs$$.pipe(this.mapData((runs) => this.buildGroups(runs)));

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildGroups(runs: HighWinRunsInfo | null | undefined): (ArenaRunInfo | string)[] | null {
		console.debug('[arena-high-wins-runs] building groups', runs);
		if (runs?.runs == null) {
			return null;
		}

		const groupingFunction = (deck: ArenaRunInfo) => {
			const date = new Date(deck.creationDate);
			return date.toLocaleDateString(this.i18n.formatCurrentLocale() ?? 'enUS', {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			});
		};
		const groupByDate = groupByFunction(groupingFunction);
		const runsByDate = groupByDate(runs.runs);
		const result = Object.keys(runsByDate).map((date) => this.buildGroupedRuns(date, runsByDate[date]));
		console.debug('[arena-high-wins-runs] built groups', result);
		return result.map((r) => [r.header, ...r.runs]).flat();
	}

	private buildGroupedRuns(date: string, runs: readonly ArenaRunInfo[]): ArenaGroupedRuns {
		return {
			header: date,
			runs: runs,
		};
	}

	trackByGroup(index, item: ArenaGroupedRuns) {
		return item.header;
	}
}
