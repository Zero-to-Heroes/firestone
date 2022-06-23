import { AfterContentInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { classesForPieChart, colorForClass, formatClass } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';
import { InputPieChartData, InputPieChartOptions } from '../../common/chart/input-pie-chart-data';

@Component({
	selector: 'decktracker-ladder-stats',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-ladder-stats.component.scss`,
	],
	template: `
		<div class="decktracker-ladder-stats">
			<decktracker-stats-for-replays [replays]="replays$ | async"></decktracker-stats-for-replays>
			<div class="graphs">
				<div class="graph player-popularity">
					<div class="title" [owTranslate]="'app.decktracker.ladder-stats.title-player'"></div>
					<pie-chart
						class="chart player-popularity-chart "
						[data]="playerPieChartData$ | async"
						[options]="pieChartOptions"
					></pie-chart>
				</div>
				<div class="graph opponents-popularity">
					<div class="title" [owTranslate]="'app.decktracker.ladder-stats.title-opponent'"></div>
					<pie-chart
						class="chart opponents-popularity-chart"
						[data]="opponentPieChartData$ | async"
						[options]="pieChartOptions"
					></pie-chart>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerLadderStatsComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit {
	replays$: Observable<readonly GameStat[]>;
	playerPieChartData$: Observable<readonly InputPieChartData[]>;
	opponentPieChartData$: Observable<readonly InputPieChartData[]>;

	pieChartOptions: InputPieChartOptions;

	constructor(
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.replays$ = combineLatest(
			this.store.listen$(([main, nav, prefs]) => main.decktracker.decks),
			this.store.listenPrefs$((prefs) => prefs.replaysActiveDeckstringsFilter),
		).pipe(
			this.mapData(([[decks], [deckstringsFilter]]) =>
				decks
					.filter((deck) => !deckstringsFilter?.length || deckstringsFilter.includes(deck.deckstring))
					.map((deck) => deck.replays)
					.reduce((a, b) => a.concat(b), []),
			),
		);
		this.playerPieChartData$ = this.replays$.pipe(this.mapData((replays) => this.buildPlayerPieChartData(replays)));
		this.opponentPieChartData$ = this.replays$.pipe(
			this.mapData((replays) => this.buildOpponentPieChartData(replays)),
		);
	}

	ngAfterViewInit() {
		this.pieChartOptions = this.buildPieChartOptions();
	}

	private buildPieChartOptions(): InputPieChartOptions {
		return {
			padding: {
				top: 0,
				bottom: 50,
				left: 90,
				right: 80,
			},
			showAllLabels: true,
			aspectRatio: 1,
			tooltipFontSize: 16,
		};
	}

	private buildPlayerPieChartData(replays: readonly GameStat[]): readonly InputPieChartData[] {
		return classesForPieChart.map((className) => {
			return {
				label: formatClass(className, this.i18n),
				data: replays.filter((replay) => replay.playerClass === className)?.length ?? 0,
				color: `${colorForClass(className)}`,
			};
		});
	}

	private buildOpponentPieChartData(replays: readonly GameStat[]): readonly InputPieChartData[] {
		return classesForPieChart.map((className) => {
			return {
				label: formatClass(className, this.i18n),
				data: replays.filter((replay) => replay.opponentClass === className)?.length ?? 0,
				color: `${colorForClass(className)}`,
			};
		});
	}
}
