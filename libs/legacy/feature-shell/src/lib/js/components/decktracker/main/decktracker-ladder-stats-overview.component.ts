import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ViewRef,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { Observable, combineLatest } from 'rxjs';
import { DecksProviderService } from '../../../services/decktracker/main/decks-provider.service';
import { classesForPieChart, colorForClass, formatClass } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { InputPieChartData, InputPieChartOptions } from '../../common/chart/input-pie-chart-data';

@Component({
	selector: 'decktracker-ladder-stats-overview',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-ladder-stats-overview.component.scss`,
	],
	template: `
		<div class="container" scrollable>
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
export class DecktrackerLadderStatsOverviewComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
	replays$: Observable<readonly GameStat[]>;
	playerPieChartData$: Observable<readonly InputPieChartData[]>;
	opponentPieChartData$: Observable<readonly InputPieChartData[]>;

	pieChartOptions: InputPieChartOptions;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly decks: DecksProviderService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.decks);

		this.replays$ = combineLatest([
			this.decks.decks$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.replaysActiveDeckstringsFilter)),
		]).pipe(
			this.mapData(([decks, deckstringsFilter]) =>
				(decks ?? [])
					.filter(
						(deck) =>
							!deckstringsFilter?.length ||
							deckstringsFilter.includes(deck.deckstring) ||
							(deck.allVersions?.map((v) => v.deckstring) ?? []).some((d) =>
								deckstringsFilter.includes(d),
							),
					)
					.map((deck) => deck.replays)
					.reduce((a, b) => a.concat(b), []),
			),
		);
		this.playerPieChartData$ = this.replays$.pipe(this.mapData((replays) => this.buildPlayerPieChartData(replays)));
		this.opponentPieChartData$ = this.replays$.pipe(
			this.mapData((replays) => this.buildOpponentPieChartData(replays)),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit() {
		this.pieChartOptions = this.buildPieChartOptions();
	}

	private buildPieChartOptions(): InputPieChartOptions {
		return {
			padding: {
				top: 0,
				bottom: 10,
				left: 10,
				right: 10,
			},
			showAllLabels: true,
			aspectRatio: 1,
			tooltipFontSize: 16,
			showLegendBelow: true,
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
