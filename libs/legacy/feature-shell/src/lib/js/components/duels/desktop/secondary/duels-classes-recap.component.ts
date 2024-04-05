import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { DuelsRun } from '@firestone/duels/general';
import { PatchesConfigService } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { Observable, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { formatClass } from '../../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { filterDuelsRuns } from '../../../../services/ui-store/duels-ui-helper';
import { groupByFunction } from '../../../../services/utils';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';
@Component({
	selector: 'duels-classes-recap',
	styleUrls: [`../../../../../css/component/duels/desktop/secondary/duels-classes-recap.component.scss`],
	template: `
		<div class="duels-classes-recap">
			<div class="header" [owTranslate]="'app.duels.classes-recap.title'"></div>
			<div class="stats" *ngIf="stat$ | async as stat">
				<duels-stat-cell
					class="stat-cell"
					[label]="'app.duels.classes-recap.total-runs' | owTranslate"
					[value]="stat.totalRuns"
				>
				</duels-stat-cell>
				<duels-stat-cell
					class="stat-cell"
					[label]="'app.duels.classes-recap.avg-wins-per-run' | owTranslate"
					[value]="stat.averageWinsPerRun"
					[decimals]="1"
				>
				</duels-stat-cell>
				<div class="stat-cell classes-list">
					<div class="entry">
						<div class="label" [owTranslate]="'app.duels.classes-recap.most-played-classes'"></div>
						<div class="filler"></div>
						<ul class="value">
							<li class="played-class" *ngFor="let mostPlayedClass of stat.mostPlayedClasses">
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
						<div class="label" [owTranslate]="'app.duels.classes-recap.best-winrate-classes'"></div>
						<div class="filler"></div>
						<ul class="value">
							<li class="played-class" *ngFor="let theClass of stat.bestWinrateClasses">
								<img [src]="theClass.icon" class="icon" [helpTooltip]="theClass.tooltip" />
							</li>
						</ul>
					</div>
				</div>
				<div class="stat-cell classes-list">
					<div class="entry">
						<div class="label" [owTranslate]="'app.duels.classes-recap.most-faced-classes'"></div>
						<div class="filler"></div>
						<ul class="value">
							<li class="played-class" *ngFor="let mostFacedClass of stat.mostFacedClasses">
								<img [src]="mostFacedClass.icon" class="icon" [helpTooltip]="mostFacedClass.tooltip" />
							</li>
						</ul>
					</div>
				</div>
				<div class="stat-cell classes-list">
					<div class="entry">
						<div class="label" [owTranslate]="'app.duels.classes-recap.best-winrate-against'"></div>
						<div class="filler"></div>
						<ul class="value">
							<li class="played-class" *ngFor="let mostFacedClass of stat.bestWinrateAgainstClasses">
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
export class DuelsClassesRecapComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	stat$: Observable<Stat>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly patchesConfig: PatchesConfigService,
	) {
		super(store, cdr);
	}

	async ngAfterContentInit() {
		await this.patchesConfig.isReady();

		this.stat$ = combineLatest([
			this.store.duelsRuns$(),
			this.store.listen$(
				([main, nav, prefs]) => prefs.duelsActiveTimeFilter,
				([main, nav, prefs]) => prefs.duelsActiveHeroesFilter2,
				([main, nav, prefs]) => prefs.duelsActiveGameModeFilter,
			),
			this.patchesConfig.currentDuelsMetaPatch$$,
		]).pipe(
			filter(([runs, [timeFilter, classFilter, gameMode]]) => !!runs?.length),
			map(([runs, [timeFilter, classFilter, gameMode], patch]) =>
				filterDuelsRuns(runs, timeFilter, classFilter, gameMode, null, patch, 0),
			),
			this.mapData((runs) => {
				return {
					totalRuns: runs.length,
					averageWinsPerRun: runs.map((run) => run.wins).reduce((a, b) => a + b, 0) / runs.length,
					mostPlayedClasses: this.buildPlayerClass(runs, (a, b) => b.length - a.length),
					bestWinrateClasses: this.buildPlayerClass(
						runs,
						(a, b) => this.buildWinrate(b) - this.buildWinrate(a),
					),
					mostFacedClasses: this.buildFacedClass(runs, (a, b) => b.length - a.length),
					bestWinrateAgainstClasses: this.buildFacedClass(
						runs,
						(a, b) => this.buildWinrateForMatches(b) - this.buildWinrateForMatches(a),
					),
				};
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildPlayerClass(
		runs: readonly DuelsRun[],
		sortFunction: (a: readonly DuelsRun[], b: readonly DuelsRun[]) => number,
	): readonly MostPlayedClass[] {
		const groupedByPlayedClass: { [playerClass: string]: readonly DuelsRun[] } = groupByFunction(
			(run: DuelsRun) => this.allCards.getCard(run.heroCardId)?.playerClass,
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
				tooltip: this.i18n.translateString('app.duels.classes-recap.stat-tooltip', {
					numberOfRuns: runsForClass.length,
					totalMatches: totalMatches,
					playerClass: playerClass,
					winrate: winrate?.toFixed(1),
				}),
			};
		});
	}

	private buildFacedClass(
		runs: readonly DuelsRun[],
		sortFunction: (a: readonly GameStat[], b: readonly GameStat[]) => number,
	): readonly MostFacedClass[] {
		const groupedByFacedClass: { [playerClass: string]: readonly GameStat[] } = groupByFunction(
			(game: GameStat) => game.opponentClass,
		)(
			runs
				.map((run) => run.steps)
				.reduce((a, b) => a.concat(b), [])
				.filter((step) => (step as GameStat).buildNumber)
				.map((step) => step as GameStat),
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
				tooltip: this.i18n.translateString('app.duels.classes-recap.faced-tooltip', {
					opponentClass: opponentClass,
					totalMatches: gamesForClass.length,
					winrate: winrate?.toFixed(1),
				}),
			};
		});
	}

	private buildWinrate(runs: readonly DuelsRun[]) {
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
}

@Component({
	selector: 'duels-stat-cell',
	styleUrls: [`../../../../../css/component/duels/desktop/secondary/duels-classes-recap.component.scss`],
	template: `
		<div class="entry">
			<div class="label">{{ label }}</div>
			<div class="filler"></div>
			<div class="value">{{ formatValue() }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsStatCellComponent {
	@Input() label: string;
	@Input() value: number;
	@Input() decimals: number;

	formatValue() {
		if (this.value == null || isNaN(this.value)) {
			return '-';
		}
		if (!this.decimals) {
			return this.value;
		}
		return this.value?.toFixed(this.decimals);
	}
}

interface Stat {
	readonly totalRuns: number;
	readonly averageWinsPerRun: number;
	readonly mostPlayedClasses: readonly MostPlayedClass[];
	readonly bestWinrateClasses: readonly MostPlayedClass[];
	readonly mostFacedClasses: readonly MostFacedClass[];
	readonly bestWinrateAgainstClasses: readonly MostFacedClass[];
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
