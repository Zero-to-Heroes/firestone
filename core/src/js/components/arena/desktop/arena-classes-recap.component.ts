import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { ArenaRun } from '../../../models/arena/arena-run';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { StatsState } from '../../../models/mainwindow/stats/stats-state';
import { formatClass } from '../../../services/hs-utils';
import { arraysEqual, groupByFunction } from '../../../services/utils';

@Component({
	selector: 'arena-classes-recap',
	styleUrls: [`../../../../css/component/arena/desktop/arena-classes-recap.component.scss`],
	template: `
		<div class="arena-classes-recap">
			<div class="header">Stats overview</div>
			<div class="stats">
				<duels-stat-cell class="stat-cell" label="Total runs" [value]="totalRuns"> </duels-stat-cell>
				<duels-stat-cell class="stat-cell" label="Avg. wins per run" [value]="averageWinsPerRun" [decimals]="1">
				</duels-stat-cell>
				<div class="stat-cell classes-list">
					<div class="entry">
						<div class="label">Most played classes</div>
						<div class="filler"></div>
						<ul class="value">
							<li class="played-class" *ngFor="let mostPlayedClass of mostPlayedClasses">
								<img
									[src]="mostPlayedClass.icon"
									class="icon"
									[helpTooltip]="mostPlayedClass.tooltip"
								/>
							</li>
						</ul>
					</div>
				</div>
				<div class="stat-cell classes-list">
					<div class="entry">
						<div class="label">Best winrate classes</div>
						<div class="filler"></div>
						<ul class="value">
							<li class="played-class" *ngFor="let theClass of bestWinrateClasses">
								<img [src]="theClass.icon" class="icon" [helpTooltip]="theClass.tooltip" />
							</li>
						</ul>
					</div>
				</div>
				<div class="stat-cell classes-list">
					<div class="entry">
						<div class="label">Most faced classes</div>
						<div class="filler"></div>
						<ul class="value">
							<li class="played-class" *ngFor="let mostFacedClass of mostFacedClasses">
								<img [src]="mostFacedClass.icon" class="icon" [helpTooltip]="mostFacedClass.tooltip" />
							</li>
						</ul>
					</div>
				</div>
				<div class="stat-cell classes-list">
					<div class="entry">
						<div class="label">Best winrate against</div>
						<div class="filler"></div>
						<ul class="value">
							<li class="played-class" *ngFor="let mostFacedClass of bestWinrateAgainstClasses">
								<img [src]="mostFacedClass.icon" class="icon" [helpTooltip]="mostFacedClass.tooltip" />
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaClassesRecapComponent {
	@Input() set state(value: StatsState) {
		if (value === this._state) {
			return;
		}

		this._state = value;
		this.updateValues(value);
	}

	totalRuns: number;
	averageWinsPerRun: number;
	mostPlayedClasses: readonly MostPlayedClass[];
	bestWinrateClasses: readonly MostPlayedClass[];
	mostFacedClasses: readonly MostFacedClass[];
	bestWinrateAgainstClasses: readonly MostFacedClass[];

	// This is used only to check for diffs between two state updates
	private arenaMatches: readonly GameStat[] = [];
	private arenaRuns: readonly ArenaRun[] = [];

	private _state: StatsState;

	constructor(private readonly allCards: AllCardsService, private readonly cdr: ChangeDetectorRef) {}

	private updateValues(state: StatsState) {
		if (!state?.gameStats?.stats) {
			return;
		}

		console.debug('setting state', state);
		let dirty = false;

		// TODO: use filters
		const arenaMatches = state.gameStats.stats.filter((stat) => stat.gameMode === 'arena');
		if (!arraysEqual(arenaMatches, this.arenaMatches)) {
			this.arenaMatches = arenaMatches;
			this.arenaRuns = this.buildArenaRuns(arenaMatches);
			dirty = true;
		}
		console.debug('arenaMatches', arenaMatches);

		if (!dirty) {
			return;
		}

		this.totalRuns = this.arenaRuns.length;
		if (this.totalRuns === 0) {
			return;
		}

		this.averageWinsPerRun = this.arenaRuns.map((run) => run.wins).reduce((a, b) => a + b, 0) / this.totalRuns;

		this.mostPlayedClasses = [];
		this.bestWinrateClasses = [];
		this.mostFacedClasses = [];
		this.bestWinrateAgainstClasses = [];

		// Get lots of errors otherwise when changing the filtesr
		setTimeout(() => {
			this.mostPlayedClasses = this.buildPlayerClass(this.arenaRuns, (a, b) => b.length - a.length);
			this.bestWinrateClasses = this.buildPlayerClass(
				this.arenaRuns,
				(a, b) => this.buildWinrate(b) - this.buildWinrate(a),
			);
			this.mostFacedClasses = this.buildFacedClass(this.arenaRuns, (a, b) => b.length - a.length);
			this.bestWinrateAgainstClasses = this.buildFacedClass(
				this.arenaRuns,
				(a, b) => this.buildWinrateForMatches(b) - this.buildWinrateForMatches(a),
			);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	private buildPlayerClass(
		runs: readonly ArenaRun[],
		sortFunction: (a: readonly ArenaRun[], b: readonly ArenaRun[]) => number,
	): readonly MostPlayedClass[] {
		const groupedByPlayedClass: { [playerClass: string]: readonly ArenaRun[] } = groupByFunction(
			(run: ArenaRun) => this.allCards.getCard(run.heroCardId)?.playerClass,
		)(runs);
		const mostPlayedClasses = Object.values(groupedByPlayedClass).sort(sortFunction).slice(0, 3);
		return mostPlayedClasses.map((runsForClass) => {
			const matches = runsForClass
				.map((run) => run.steps)
				.reduce((a, b) => a.concat(b), [])
				.filter((step) => (step as GameStat).buildNumber)
				.map((step) => step as GameStat); // Just filter out the non-match steps
			const totalMatches = matches.length;
			const wins = matches.filter((match) => match.result === 'won').length;
			const winrate = (100 * wins) / totalMatches;
			const playerClass = formatClass(this.allCards.getCard(runsForClass[0].heroCardId)?.playerClass);
			return {
				icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${runsForClass[0].heroCardId}.jpg`,
				totalRuns: runsForClass.length,
				totalMatches: totalMatches,
				winrate: winrate,
				tooltip: `You played ${
					runsForClass.length
				} runs and ${totalMatches} matches with ${playerClass} with a ${winrate?.toFixed(1)}% winrate`,
			};
		});
	}

	private buildFacedClass(
		runs: readonly ArenaRun[],
		sortFunction: (a: readonly GameStat[], b: readonly GameStat[]) => number,
	): readonly MostFacedClass[] {
		const groupedByFacedClass: { [playerClass: string]: readonly GameStat[] } = groupByFunction(
			(game: GameStat) => game.opponentClass,
		)(
			runs
				.map((run) => run.steps)
				.reduce((a, b) => a.concat(b), [])
				.filter((step) => (step as GameStat).buildNumber),
		);
		const mostFacedClasses = Object.values(groupedByFacedClass).sort(sortFunction).slice(0, 3);
		return mostFacedClasses.map((gamesForClass) => {
			const opponentClass = formatClass(gamesForClass[0].opponentClass);
			const wins = gamesForClass.filter((match) => match.result === 'won').length;
			const winrate = (100 * wins) / gamesForClass.length;
			return {
				icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${gamesForClass[0].opponentCardId}.jpg`,
				totalMatches: gamesForClass.length,
				winrate: winrate,
				tooltip: `You faced ${opponentClass} ${gamesForClass.length} times with a ${winrate?.toFixed(
					1,
				)}% winrate`,
			};
		});
	}

	private buildWinrate(runs: readonly ArenaRun[]) {
		const matches = runs
			.map((run) => run.steps)
			.reduce((a, b) => a.concat(b), [])
			.filter((step) => (step as GameStat).buildNumber)
			.map((step) => step as GameStat); // Just filter out the non-match steps
		return this.buildWinrateForMatches(matches);
	}

	private buildWinrateForMatches(matches: readonly GameStat[]) {
		const totalMatches = matches.length;
		const wins = matches.filter((match) => match.result === 'won').length;
		return (100 * wins) / totalMatches;
	}

	private buildArenaRuns(arenaMatches: GameStat[]): readonly ArenaRun[] {
		const groupedByRun = groupByFunction((match: GameStat) => match.runId)(arenaMatches);
		return Object.values(groupedByRun).map((matches: readonly GameStat[]) => {
			const firstMatch = matches[0];
			return ArenaRun.create({
				id: firstMatch.runId,
				creationTimestamp: firstMatch.creationTimestamp,
				heroCardId: firstMatch.playerCardId,
				initialDeckList: firstMatch.playerDecklist,
				wins: matches.filter((match) => match.result === 'won').length,
				losses: matches.filter((match) => match.result === 'lost').length,
				steps: matches,
			} as ArenaRun);
		});
	}
}

// @Component({
// 	selector: 'duels-stat-cell',
// 	styleUrls: [`../../../../../css/component/duels/desktop/secondary/duels-classes-recap.component.scss`],
// 	template: `
// 		<div class="entry">
// 			<div class="label">{{ label }}</div>
// 			<div class="filler"></div>
// 			<div class="value">{{ formatValue() }}</div>
// 		</div>
// 	`,
// 	changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class DuelsStatCellComponent {
// 	@Input() label: string;
// 	@Input() value: number;
// 	@Input() decimals: number;

// 	formatValue() {
// 		if (!this.decimals) {
// 			return this.value;
// 		}
// 		return this.value?.toFixed(this.decimals);
// 	}
// }

interface MostPlayedClass {
	readonly icon: string;
	readonly totalRuns: number;
	readonly totalMatches: number;
	readonly tooltip: string;
	readonly winrate: number;
}

interface MostFacedClass {
	readonly icon: string;
	readonly totalMatches: number;
	readonly tooltip: string;
	readonly winrate: number;
}
