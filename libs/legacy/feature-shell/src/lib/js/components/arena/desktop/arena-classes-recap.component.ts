import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { combineLatest, Observable } from 'rxjs';
import { ArenaClassFilterType } from '../../../models/arena/arena-class-filter.type';
import { ArenaRun } from '../../../models/arena/arena-run';
import { ArenaTimeFilterType } from '../../../models/arena/arena-time-filter.type';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { PatchInfo } from '../../../models/patches';
import { formatClass } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { arraysEqual, groupByFunction } from '../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'arena-classes-recap',
	styleUrls: [`../../../../css/component/arena/desktop/arena-classes-recap.component.scss`],
	template: `
		<div class="arena-classes-recap">
			<div class="header" [owTranslate]="'app.arena.stats.title'"></div>
			<div class="stats" *ngIf="stats$ | async as stats">
				<duels-stat-cell
					class="stat-cell"
					[label]="'app.arena.stats.total-runs' | owTranslate"
					[value]="stats.totalRuns"
				>
				</duels-stat-cell>
				<duels-stat-cell
					class="stat-cell"
					[label]="'app.arena.stats.wins-per-run' | owTranslate"
					[value]="stats.averageWinsPerRun"
					[decimals]="1"
				>
				</duels-stat-cell>
				<div class="stat-cell classes-list">
					<div class="entry">
						<div class="label" [owTranslate]="'app.arena.stats.most-played-classes'"></div>
						<div class="filler"></div>
						<ul class="value" *ngIf="stats.mostPlayedClasses?.length">
							<li
								class="played-class"
								*ngFor="let mostPlayedClass of stats.mostPlayedClasses; trackBy: trackByMostPlayedClass"
							>
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
						<div class="label" [owTranslate]="'app.arena.stats.best-winrate-classes'"></div>
						<div class="filler"></div>
						<ul class="value" *ngIf="stats.bestWinrateClasses?.length">
							<li
								class="played-class"
								*ngFor="let theClass of stats.bestWinrateClasses; trackBy: trackByMostPlayedClass"
							>
								<img [src]="theClass.icon" class="icon" [helpTooltip]="theClass.tooltip" />
							</li>
						</ul>
						<div class="value" *ngIf="!stats.bestWinrateClasses?.length">-</div>
					</div>
				</div>
				<div class="stat-cell classes-list">
					<div class="entry">
						<div class="label" [owTranslate]="'app.arena.stats.most-faced-classes'"></div>
						<div class="filler"></div>
						<ul class="value" *ngIf="stats.mostFacedClasses?.length">
							<li
								class="played-class"
								*ngFor="let mostFacedClass of stats.mostFacedClasses; trackBy: trackByMostFacedClass"
							>
								<img [src]="mostFacedClass.icon" class="icon" [helpTooltip]="mostFacedClass.tooltip" />
							</li>
						</ul>
						<div class="value" *ngIf="!stats.mostFacedClasses?.length">-</div>
					</div>
				</div>
				<div class="stat-cell classes-list">
					<div class="entry">
						<div class="label" [owTranslate]="'app.arena.stats.best-winrate-against'"></div>
						<div class="filler"></div>
						<ul class="value" *ngIf="stats.bestWinrateAgainstClasses?.length">
							<li
								class="played-class"
								*ngFor="
									let mostFacedClass of stats.bestWinrateAgainstClasses;
									trackBy: trackByMostFacedClass
								"
							>
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
export class ArenaClassesRecapComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	stats$: Observable<StatInfo>;

	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.stats$ = combineLatest(
			this.store.gameStats$(),
			this.store.listen$(
				([main, nav]) => main.arena.activeTimeFilter,
				([main, nav]) => main.arena.activeHeroFilter,
				([main, nav]) => main.arena.currentArenaMetaPatch,
			),
		).pipe(
			this.mapData(([stats, [timeFilter, heroFilter, patch]]) => {
				const arenaMatches = stats?.filter((stat) => stat.gameMode === 'arena');
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
		);
	}

	trackByMostPlayedClass(index: number, item: MostPlayedClass) {
		return item.icon;
	}

	trackByMostFacedClass(index: number, item: MostFacedClass) {
		return item.icon;
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
			const playerClass = formatClass(this.allCards.getCard(runsForClass[0].heroCardId)?.playerClass, this.i18n);
			return {
				icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${runsForClass[0].heroCardId}.jpg`,
				totalRuns: runsForClass.length,
				totalMatches: totalMatches,
				winrate: winrate,
				tooltip: this.i18n.translateString('app.arena.stats.stat-tooltip', {
					numberOfRuns: runsForClass.length,
					totalMatches: totalMatches,
					playerClass: playerClass,
					winrate: winrate?.toFixed(1),
				}),
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
			const opponentClass = formatClass(gamesForClass[0].opponentClass, this.i18n);
			const wins = gamesForClass.filter((match) => match.result === 'won').length;
			const winrate = (100 * wins) / gamesForClass.length;
			return {
				icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${gamesForClass[0].opponentCardId}.jpg`,
				totalMatches: gamesForClass.length,
				winrate: winrate,
				tooltip: this.i18n.translateString('app.arena.stats.faced-tooltip', {
					opponentClass: opponentClass,
					totalMatches: gamesForClass.length,
					winrate: winrate?.toFixed(1),
				}),
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
			// See bgs-ui-helper
			case 'last-patch':
				return (
					firstMatch.buildNumber >= patch.number ||
					firstMatch.creationTimestamp > new Date(patch.date).getTime() + 24 * 60 * 60 * 1000
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
