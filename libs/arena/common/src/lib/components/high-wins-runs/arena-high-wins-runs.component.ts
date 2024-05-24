import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { ArenaRunInfo } from '@firestone-hs/arena-high-win-runs';
import { ArenaClassFilterType, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual, groupByFunction } from '@firestone/shared/framework/common';
import { ILocalizationService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { ArenaGroupedRuns, ExtendedHighWinRunsInfo } from '../../models/arena-high-wins-runs';
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
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.runsService, this.prefs);

		this.runGroups$ = combineLatest([
			this.runsService.runs$$,
			this.runsService.cardSearch$$,
			this.prefs.preferences$$.pipe(
				this.mapData(
					(prefs) => ({
						playerClass: prefs.arenaActiveClassFilter,
						wins: prefs.arenaActiveWinsFilter,
					}),
					(a, b) => deepEqual(a, b),
				),
			),
		]).pipe(
			this.mapData(([runs, cardSearch, { playerClass, wins }]) =>
				this.buildGroups(runs, cardSearch, playerClass, wins),
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildGroups(
		runs: ExtendedHighWinRunsInfo | null | undefined,
		cardSearch: readonly string[] | null | undefined,
		playerClass: ArenaClassFilterType | null,
		wins: number | null,
	): (ArenaRunInfo | string)[] | null {
		console.debug('[arena-high-wins-runs] building groups', runs, playerClass);
		if (runs?.runs == null) {
			return null;
		}

		const filteredRuns = runs.runs
			.filter((run) => !wins || run.wins >= wins)
			.filter((run) => !playerClass || playerClass === 'all' || run.playerClass === playerClass)
			.filter((run) => !cardSearch?.length || run.notabledCards?.some((c) => cardSearch.includes(c.cardId)));
		const groupingFunction = (deck: ArenaRunInfo) => {
			const date = new Date(deck.creationDate);
			return date.toLocaleDateString(this.i18n.formatCurrentLocale() ?? 'enUS', {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			});
		};
		const groupByDate = groupByFunction(groupingFunction);
		const runsByDate = groupByDate(filteredRuns);
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
