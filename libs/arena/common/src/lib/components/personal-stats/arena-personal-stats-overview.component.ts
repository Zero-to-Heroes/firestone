/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { RewardType } from '@firestone-hs/reference-data';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { extractTime } from '@firestone/stats/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { ArenaRun } from '../../models/arena-run';

@Component({
	selector: 'arena-personal-stats-overview',
	styleUrls: [`./arena-personal-stats-overview.component.scss`],
	template: `
		<ul class="global-stats">
			<li class="global-stat {{ stat.class }}" *ngFor="let stat of stats$ | async">
				<div class="label" [helpTooltip]="stat.tooltip ?? null">{{ stat.label }}</div>
				<div class="value">{{ stat.value }}</div>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaPersonalStatsOverviewComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	stats$: Observable<readonly InternalStat[]>;

	@Input() set runs(value: readonly ArenaRun[] | undefined | null) {
		this.runs$$.next(value);
	}

	private runs$$ = new BehaviorSubject<readonly ArenaRun[] | undefined | null>(undefined);

	constructor(protected override readonly cdr: ChangeDetectorRef, private readonly i18n: ILocalizationService) {
		super(cdr);
	}

	ngAfterContentInit() {
		this.stats$ = this.runs$$.pipe(this.mapData((runs) => this.buildStats(runs)));
	}

	private buildStats(allRuns: readonly ArenaRun[] | undefined | null): readonly InternalStat[] {
		const runs = allRuns?.filter((r) => !!r?.getFirstMatch()) ?? [];
		const replays = runs.flatMap((r) => r.steps) ?? [];

		const replaysFirst = replays.filter((replay) => replay.coinPlay === 'play') ?? [];
		const replaysCoin = replays.filter((replay) => replay.coinPlay === 'coin') ?? [];
		const replaysWon = replays.filter((replay) => replay.result === 'won') ?? [];
		const replaysLost = replays.filter((replay) => replay.result === 'lost') ?? [];

		// const turnsToWin =
		// 	replaysWon
		// 		.filter((replay) => replay.gameDurationTurns)
		// 		.map((replay) => replay.gameDurationTurns)
		// 		.reduce((a, b) => a + b, 0) / replaysWon.filter((replay) => replay.gameDurationTurns).length;
		// const turnsToLose =
		// 	replaysLost
		// 		.filter((replay) => replay.gameDurationTurns)
		// 		.map((replay) => replay.gameDurationTurns)
		// 		.reduce((a, b) => a + b, 0) / replaysLost.filter((replay) => replay.gameDurationTurns).length;
		const winrate = !!replays.length ? (100 * replaysWon.length) / replays.length : null;
		const winrateFirst = !!replaysFirst.length
			? (100 * replaysFirst.filter((replay) => replay.result === 'won').length) / replaysFirst.length
			: null;
		const winrateCoin = !!replaysCoin.length
			? (100 * replaysCoin.filter((replay) => replay.result === 'won').length) / replaysCoin.length
			: null;

		const { average: leaderboardAverage, runsPlayed } = this.buildLeaderboardAverage(runs ?? []);
		const allRewards = runs?.flatMap((r) => r.rewards).filter((r) => !!r) ?? [];
		const totalRunsWithRewards = runs?.filter((r) => !!r.rewards?.length).length ?? 0;

		const rewardTotalGold = allRewards
			.filter((r) => r.rewardType === RewardType.GOLD)
			.map((r) => r.rewardAmount)
			.reduce((a, b) => a + b, 0);
		const rewardAverageGold = totalRunsWithRewards > 0 ? rewardTotalGold / totalRunsWithRewards : null;

		const rewardTotalDust = allRewards
			.filter((r) => r.rewardType === RewardType.ARCANE_DUST)
			.map((r) => r.rewardAmount)
			.reduce((a, b) => a + b, 0);
		const rewardAverageDust = totalRunsWithRewards > 0 ? rewardTotalDust / totalRunsWithRewards : null;

		const rewardTotalPacks = allRewards
			.filter((r) => r.rewardType === RewardType.BOOSTER_PACK)
			.map((r) => r.rewardAmount)
			.reduce((a, b) => a + b, 0);
		const rewardAveragePacks = totalRunsWithRewards > 0 ? rewardTotalPacks / totalRunsWithRewards : null;

		const totalMatchTime = replays.map((replay) => replay.gameDurationSeconds).reduce((a, b) => a + b, 0);
		const averageMatchTimeInSeconds = replays.length ? Math.round(totalMatchTime / replays.length) : null;
		const averageMatchTime: string | null = averageMatchTimeInSeconds
			? this.i18n.translateString('global.duration.min-sec', {
					...extractTime(averageMatchTimeInSeconds),
			  })
			: null;

		return [
			{
				label: this.i18n.translateString('app.arena.personal-stats.leaderboard-average')!,
				tooltip: this.i18n.translateString('app.arena.personal-stats.leaderboard-average-tooltip')!,
				value: `${leaderboardAverage?.toLocaleString() ?? '-'}`,
				class: runsPlayed < 30 ? 'leaderboard-average-temp' : 'leaderboard-average',
			},
			{
				label: this.i18n.translateString('app.arena.personal-stats.reward-gold')!,
				tooltip: this.i18n.translateString('app.arena.personal-stats.reward-gold-tooltip')!,
				value: `${rewardTotalGold?.toLocaleString() ?? '-'} / ${rewardAverageGold?.toFixed(0) ?? '-'}`,
			},
			{
				label: this.i18n.translateString('app.arena.personal-stats.reward-dust')!,
				tooltip: this.i18n.translateString('app.arena.personal-stats.reward-dust-tooltip')!,
				value: `${rewardTotalDust?.toLocaleString() ?? '-'} / ${rewardAverageDust?.toFixed(0) ?? '-'}`,
			},
			{
				label: this.i18n.translateString('app.arena.personal-stats.reward-packs')!,
				tooltip: this.i18n.translateString('app.arena.personal-stats.reward-packs-tooltip')!,
				value: `${rewardTotalPacks?.toLocaleString() ?? '-'} / ${rewardAveragePacks?.toFixed(0) ?? '-'}`,
			},
			{
				label: this.i18n.translateString('app.arena.personal-stats.average-match-time')!,
				tooltip: this.i18n.translateString('app.arena.personal-stats.average-match-time-tooltip')!,
				value: `${averageMatchTime ?? '-'}`,
			},
			// {
			// 	label: this.i18n.translateString('app.arena.stats.total-runs')!,
			// 	value: `${runsPlayed?.toLocaleString() ?? '0'}`,
			// 	class: 'games',
			// },
			// {
			// 	label: this.i18n.translateString('app.arena.stats.total-games-played')!,
			// 	value: `${replays?.length?.toLocaleString() ?? '0'}`,
			// 	class: 'games',
			// },
			// {
			// 	label: this.i18n.translateString('app.decktracker.stats.total-time-played')!,
			// 	value: `${this.toAppropriateDurationFromSeconds(
			// 		replays?.map((replay) => replay.gameDurationSeconds).reduce((a, b) => a + b, 0) ?? 0,
			// 	)}`,
			// },
			// {
			// 	label: this.i18n.translateString('app.decktracker.stats.turns-to-win')!,
			// 	value: `${isNaN(turnsToWin) ? '-' : turnsToWin.toFixed(1)}`,
			// },
			// {
			// 	label: this.i18n.translateString('app.decktracker.stats.turns-to-lose')!,
			// 	value: `${isNaN(turnsToLose) ? '-' : turnsToLose.toFixed(1)}`,
			// },
			// {
			// 	label: this.i18n.translateString('app.decktracker.stats.winrate')!,
			// 	value: `${winrate == null || isNaN(winrate) ? '-' : winrate.toFixed(1)}%`,
			// 	class: 'winrate ',
			// },
			// {
			// 	label: this.i18n.translateString('app.decktracker.stats.winrate-first')!,
			// 	value: `${winrateFirst == null || isNaN(winrateFirst) ? '-' : winrateFirst.toFixed(1)}%`,
			// 	class: 'winrate ',
			// },
			// {
			// 	label: this.i18n.translateString('app.decktracker.stats.winrate-coin')!,
			// 	value: `${winrateCoin == null || isNaN(winrateCoin) ? '-' : winrateCoin.toFixed(1)}%`,
			// 	class: 'winrate ',
			// },
		];
	}

	// https://twitter.com/themattlondon/status/1625289662528094208
	private buildLeaderboardAverage(runs: readonly ArenaRun[]): { average: number | null; runsPlayed: number } {
		if (!runs?.length) {
			return { average: null, runsPlayed: 0 };
		}
		const [firstThirty, others] = runs.reduce(
			(acc, run) => {
				if (acc[0].length < 30) {
					acc[0].push(run);
				} else {
					acc[1].push(run);
				}
				return acc;
			},
			[[], []] as [ArenaRun[], ArenaRun[]],
		);
		let currentAverage = firstThirty.reduce((acc, run) => acc + run.wins, 0) / firstThirty.length;
		for (let i = 0; i < others.length; i++) {
			const run = others[i];
			currentAverage = (currentAverage * 29) / 30 + run.wins / 30;
		}
		return {
			average: currentAverage,
			runsPlayed: runs.length,
		};
	}

	// private toAppropriateDurationFromSeconds(durationInSeconds: number): string {
	// 	if (durationInSeconds < 60) {
	// 		return this.i18n.translateString('global.duration.sec', { sec: durationInSeconds })!;
	// 	} else if (durationInSeconds < 3600) {
	// 		return this.i18n.translateString('global.duration.min', { min: Math.round(durationInSeconds / 60) })!;
	// 		// } else if (durationInSeconds < 3600 * 24) {
	// 	} else {
	// 		const hours = Math.floor(durationInSeconds / 3600);
	// 		const min = Math.floor((durationInSeconds - 3600 * hours) / 60);
	// 		return this.i18n.translateString('global.duration.hrs-min', {
	// 			hrs: hours.toLocaleString(),
	// 			min: min.toLocaleString().padStart(2, '0'),
	// 		})!;
	// 	}
	// }
}

interface InternalStat {
	readonly label: string;
	readonly tooltip?: string;
	readonly value: string;
	readonly class?: string;
}
