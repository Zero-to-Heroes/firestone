import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { ArenaClassFilterType } from '../../../models/arena/arena-class-filter.type';
import { ArenaRun } from '../../../models/arena/arena-run';
import { ArenaTimeFilterType } from '../../../models/arena/arena-time-filter.type';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { PatchInfo } from '../../../models/patches';
import { formatClass } from '../../../services/hs-utils';
import { AppUiStoreService, cdLog } from '../../../services/ui-store/app-ui-store.service';
import { arraysEqual, groupByFunction } from '../../../services/utils';

@Component({
	selector: 'arena-classes-recap',
	styleUrls: [`../../../../css/component/arena/desktop/arena-classes-recap.component.scss`],
	template: `
		<div class="arena-classes-recap">
			<div class="header">Stats overview</div>
			<div class="stats" *ngIf="stats$ | async as stats">
				<duels-stat-cell class="stat-cell" label="Total runs" [value]="stats.totalRuns"> </duels-stat-cell>
				<duels-stat-cell
					class="stat-cell"
					label="Avg. wins per run"
					[value]="stats.averageWinsPerRun"
					[decimals]="1"
				>
				</duels-stat-cell>
				<div class="stat-cell classes-list">
					<div class="entry">
						<div class="label">Most played classes</div>
						<div class="filler"></div>
						<ul class="value" *ngIf="stats.mostPlayedClasses?.length">
							<li class="played-class" *ngFor="let mostPlayedClass of stats.mostPlayedClasses">
								<img
									[src]="mostPlayedClass.icon"
									class="icon"
									[helpTooltip]="mostPlayedClass.tooltip"
								/>
							</li>
						</ul>
						<div class="value" *ngIf="!stats.mostPlayedClasses?.length">-</div>
					</div>
				</div>
				<div class="stat-cell classes-list">
					<div class="entry">
						<div class="label">Best winrate classes</div>
						<div class="filler"></div>
						<ul class="value" *ngIf="stats.bestWinrateClasses?.length">
							<li class="played-class" *ngFor="let theClass of stats.bestWinrateClasses">
								<img [src]="theClass.icon" class="icon" [helpTooltip]="theClass.tooltip" />
							</li>
						</ul>
						<div class="value" *ngIf="!stats.bestWinrateClasses?.length">-</div>
					</div>
				</div>
				<div class="stat-cell classes-list">
					<div class="entry">
						<div class="label">Most faced classes</div>
						<div class="filler"></div>
						<ul class="value" *ngIf="stats.mostFacedClasses?.length">
							<li class="played-class" *ngFor="let mostFacedClass of stats.mostFacedClasses">
								<img [src]="mostFacedClass.icon" class="icon" [helpTooltip]="mostFacedClass.tooltip" />
							</li>
						</ul>
						<div class="value" *ngIf="!stats.mostFacedClasses?.length">-</div>
					</div>
				</div>
				<div class="stat-cell classes-list">
					<div class="entry">
						<div class="label">Best winrate against</div>
						<div class="filler"></div>
						<ul class="value" *ngIf="stats.bestWinrateAgainstClasses?.length">
							<li class="played-class" *ngFor="let mostFacedClass of stats.bestWinrateAgainstClasses">
								<img [src]="mostFacedClass.icon" class="icon" [helpTooltip]="mostFacedClass.tooltip" />
							</li>
						</ul>
						<div class="value" *ngIf="!stats.bestWinrateAgainstClasses?.length">-</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaClassesRecapComponent {
	stats$: Observable<StatInfo>;

	constructor(private readonly allCards: CardsFacadeService, private readonly store: AppUiStoreService) {
		this.stats$ = this.store
			.listen$(
				([main, nav]) => main.stats.gameStats.stats,
				([main, nav]) => main.arena.activeTimeFilter,
				([main, nav]) => main.arena.activeHeroFilter,
				([main, nav]) => main.arena.currentArenaMetaPatch,
			)
			.pipe(
				filter(([stats, timeFilter, heroFilter, patch]) => !!stats?.length),
				distinctUntilChanged((a, b) => this.areEqual(a, b)),
				map(([stats, timeFilter, heroFilter, patch]) => {
					const arenaMatches = stats.filter((stat) => stat.gameMode === 'arena');
					if (!arenaMatches.length) {
						return null;
					}

					const arenaRuns = this.buildArenaRuns(arenaMatches, timeFilter, heroFilter, patch);
					const totalRuns = arenaRuns.length;
					return {
						totalRuns: totalRuns,
						averageWinsPerRun: arenaRuns.map((run) => run.wins).reduce((a, b) => a + b, 0) / totalRuns,
						mostPlayedClasses: this.buildPlayerClass(arenaRuns, (a, b) => b.length - a.length),
						bestWinrateClasses: this.buildPlayerClass(
							arenaRuns,
							(a, b) => this.buildWinrate(b) - this.buildWinrate(a),
						),
						mostFacedClasses: this.buildFacedClass(arenaRuns, (a, b) => b.length - a.length),
						bestWinrateAgainstClasses: this.buildFacedClass(
							arenaRuns,
							(a, b) => this.buildWinrateForMatches(b) - this.buildWinrateForMatches(a),
						),
					};
				}),
				filter((result) => !!result),
				tap((info) => cdLog('emitting arena classes recap in ', this.constructor.name, info)),
			);
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

	private buildArenaRuns(
		arenaMatches: GameStat[],
		timeFilter: ArenaTimeFilterType,
		heroFilter: ArenaClassFilterType,
		patch: PatchInfo,
	): readonly ArenaRun[] {
		if (!arenaMatches?.length) {
			return [];
		}

		const groupedByRun = groupByFunction((match: GameStat) => match.runId)(arenaMatches);
		const runs = Object.values(groupedByRun).map((matches: readonly GameStat[]) => {
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
		return runs
			.filter((match) => this.isCorrectHero(match, heroFilter))
			.filter((match) => this.isCorrectTime(match, timeFilter, patch));
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
				return (
					firstMatch.buildNumber >= patch.number &&
					firstMatch.creationTimestamp > new Date(patch.date).getTime()
				);
			case 'past-three':
				return Date.now() - firstMatchTimestamp < 3 * 24 * 60 * 60 * 1000;
			case 'past-seven':
				return Date.now() - firstMatchTimestamp < 7 * 24 * 60 * 60 * 1000;
			default:
				return true;
		}
	}

	private areEqual(
		a: [readonly GameStat[], string, string, PatchInfo],
		b: [readonly GameStat[], string, string, PatchInfo],
	): boolean {
		// console.debug('areEqual', a, b);
		if (a[1] !== b[1] || a[2] !== b[2] || a[3] !== b[3]) {
			return false;
		}
		return arraysEqual(a[0], b[0]);
	}
}

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

interface StatInfo {
	readonly totalRuns: number;
	readonly averageWinsPerRun: number;
	readonly mostPlayedClasses: readonly MostPlayedClass[];
	readonly bestWinrateClasses: readonly MostPlayedClass[];
	readonly mostFacedClasses: readonly MostFacedClass[];
	readonly bestWinrateAgainstClasses: readonly MostFacedClass[];
}
