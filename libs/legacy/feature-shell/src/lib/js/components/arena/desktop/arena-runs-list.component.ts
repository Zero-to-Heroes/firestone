import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { HeaderInfo } from '@components/replays/replays-list-view.component';
import { ArenaRewardInfo } from '@firestone-hs/api-arena-rewards';
import { DraftDeckStats } from '@firestone-hs/arena-draft-pick';
import { ArenaRun } from '@firestone/arena/common';
import { PreferencesService } from '@firestone/shared/common/service';
import { GameStat } from '@firestone/stats/data-access';
import { Observable, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ArenaClassFilterType } from '../../../models/arena/arena-class-filter.type';
import { ArenaTimeFilterType } from '../../../models/arena/arena-time-filter.type';
import { PatchInfo } from '../../../models/patches';
import { ArenaDeckStatsService } from '../../../services/arena/arena-deck-stats.service';
import { ArenaRewardsService } from '../../../services/arena/arena-rewards.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { PatchesConfigService } from '../../../services/patches-config.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { groupByFunction } from '../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

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
export class ArenaRunsListComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit, OnDestroy {
	runs$: Observable<(ArenaRun | HeaderInfo)[]>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly patchesConfig: PatchesConfigService,
		private readonly arenaRewards: ArenaRewardsService,
		private readonly arenaDeckStats: ArenaDeckStatsService,
		private readonly prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.patchesConfig.isReady();
		await this.arenaRewards.isReady();
		await this.arenaDeckStats.isReady();
		await this.prefs.isReady();

		// TODO perf: split this into two observables, so that we don't reocmpute the
		// arena runs when a filter changes?
		this.runs$ = combineLatest([
			this.store.gameStats$(),
			this.arenaRewards.arenaRewards$$,
			this.arenaDeckStats.deckStats$$,
			this.prefs.preferences$$.pipe(
				this.mapData(
					(prefs) => ({
						timeFilter: prefs.arenaActiveTimeFilter,
						heroFilter: prefs.arenaActiveClassFilter,
					}),
					(a, b) => a.timeFilter === b.timeFilter && a.heroFilter === b.heroFilter,
				),
			),
			this.patchesConfig.currentArenaMetaPatch$$,
		]).pipe(
			filter(([stats, rewards, deckStats, { timeFilter, heroFilter }]) => !!stats?.length),
			this.mapData(([stats, rewards, deckStats, { timeFilter, heroFilter }, patch]) => {
				const arenaMatches = stats.filter((stat) => stat.gameMode === 'arena').filter((stat) => !!stat.runId);
				const arenaRuns = this.buildArenaRuns(arenaMatches, rewards, deckStats);
				const filteredRuns = arenaRuns
					.filter((match) => this.isCorrectHero(match, heroFilter))
					.filter((match) => this.isCorrectTime(match, timeFilter, patch));
				const groupedRuns = this.groupRuns(filteredRuns);
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

	private isCorrectHero(run: ArenaRun, heroFilter: ArenaClassFilterType): boolean {
		return !heroFilter || heroFilter === 'all' || run.getFirstMatch()?.playerClass?.toLowerCase() === heroFilter;
	}

	private isCorrectTime(run: ArenaRun, timeFilter: ArenaTimeFilterType, patch: PatchInfo): boolean {
		if (timeFilter === 'all-time') {
			return true;
		}
		const firstMatch = run.getFirstMatch();
		if (!firstMatch) {
			return false;
		}

		const firstMatchTimestamp = firstMatch.creationTimestamp;
		switch (timeFilter) {
			case 'last-patch':
				// See bgs-ui-helper
				return (
					!!patch &&
					(firstMatch.buildNumber >= patch.number ||
						firstMatch.creationTimestamp > new Date(patch.date).getTime() + 24 * 60 * 60 * 1000)
				);
			case 'past-three':
				return Date.now() - firstMatchTimestamp < 3 * 24 * 60 * 60 * 1000;
			case 'past-seven':
				return Date.now() - firstMatchTimestamp < 7 * 24 * 60 * 60 * 1000;
			default:
				return true;
		}
	}

	private buildArenaRuns(
		arenaMatches: readonly GameStat[],
		rewards: readonly ArenaRewardInfo[],
		deckStats: readonly DraftDeckStats[],
	): readonly ArenaRun[] {
		const matchesGroupedByRun = !!arenaMatches?.length
			? groupByFunction((match: GameStat) => match.runId)(arenaMatches)
			: {};
		const rewardsGroupedByRun = !!rewards?.length
			? groupByFunction((reward: ArenaRewardInfo) => reward.runId)(rewards)
			: {};
		return Object.keys(matchesGroupedByRun).map((runId: string) => {
			const matches: readonly GameStat[] = matchesGroupedByRun[runId];
			const rewards = rewardsGroupedByRun[runId];
			const draftStat = deckStats?.find((stat) => stat.runId === runId);
			const firstMatch = matches[0];
			const sortedMatches = [...matches].sort((a, b) => a.creationTimestamp - b.creationTimestamp);
			const [wins, losses] = this.extractWins(sortedMatches);
			console.debug('extracted wins', wins, losses, sortedMatches);
			return ArenaRun.create({
				id: firstMatch.runId,
				creationTimestamp: firstMatch.creationTimestamp,
				heroCardId: firstMatch.playerCardId,
				initialDeckList: firstMatch.playerDecklist,
				wins: wins,
				losses: losses,
				steps: matches,
				rewards: rewards,
				draftStat: draftStat,
			} as ArenaRun);
		});
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

	private extractWins(sortedMatches: readonly GameStat[]): [number, number] {
		if (sortedMatches.length === 0) {
			return [null, null];
		}
		const lastMatch = sortedMatches[sortedMatches.length - 1];
		if (!lastMatch.additionalResult || lastMatch.additionalResult.indexOf('-') === -1) {
			return [
				sortedMatches.filter((m) => m.result === 'won').length,
				sortedMatches.filter((m) => m.result === 'lost').length,
			];
		}
		const [wins, losses] = lastMatch.additionalResult.split('-').map((info) => parseInt(info));

		return lastMatch.result === 'won' ? [wins + 1, losses] : [wins, losses + 1];
	}
}

interface GroupedRun {
	readonly header: string;
	readonly runs: readonly ArenaRun[];
}
