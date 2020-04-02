import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	ViewRef,
} from '@angular/core';
import { Label } from 'aws-sdk/clients/cloudhsm';
import { ChartDataSets, ChartOptions } from 'chart.js';
import { Color } from 'ng2-charts';
import { BgsPostMatchStats } from '../../../models/battlegrounds/post-match/bgs-post-match-stats';
import { BgsPostMatchStatsPanel } from '../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { ChartUtils } from './chart-utils';

declare let amplitude: any;

@Component({
	selector: 'bgs-chart-warband-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-chart-warband-stats.component.scss`,
	],
	template: `
		<div class="chart-container">
			<div style="display: block;">
				<canvas
					baseChart
					*ngIf="lineChartData"
					[style.width.px]="chartWidth"
					[style.height.px]="chartHeight"
					[datasets]="lineChartData"
					[labels]="lineChartLabels"
					[options]="lineChartOptions"
					[colors]="lineChartColors"
					[legend]="true"
					[chartType]="'line'"
				></canvas>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsChartWarbandStatsComponent {
	chartWidth: number;
	chartHeight: number;
	lineChartData: ChartDataSets[];
	lineChartLabels: Label[];
	lineChartOptions: ChartOptions = {
		responsive: true,
		scales: {
			// We use this empty structure as a placeholder for dynamic theming.
			xAxes: [{}],
			yAxes: [
				{
					id: 'delta-stats',
					position: 'left',
				},
			],
		},
	};
	lineChartColors: Color[] = [];

	@Input() set stats(value: BgsPostMatchStatsPanel) {
		this.setStats(value);
	}

	constructor(private readonly el: ElementRef, private readonly cdr: ChangeDetectorRef) {}

	async ngAfterViewInit() {
		this.onResize();
	}

	@HostListener('window:resize')
	onResize() {
		const chartContainer = this.el.nativeElement.querySelector('.chart-container');
		const rect = chartContainer.getBoundingClientRect();
		console.log('chartContainer', chartContainer, rect);
		this.chartWidth = rect.width;
		this.chartHeight = rect.width / 2;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async setStats(value: BgsPostMatchStatsPanel) {
		this.lineChartData = await this.buildChartData(value);
		this.lineChartLabels = await this.buildChartLabels(value.stats);
		this.lineChartColors = await this.buildChartColors(value.stats);
		console.log('built line colors', this.lineChartColors);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildChartData(value: BgsPostMatchStatsPanel): ChartDataSets[] {
		const thisGameData = value.stats.totalStatsOverTurn.map(info => info.value);
		const averageData: number[] = [];
		for (let i = 0; i < thisGameData.length; i++) {
			averageData.push(
				(value.globalStats.heroStats.find(stat => stat.id === value.player.cardId).warbandStats[i]
					?.totalStats || 0) +
					(value.globalStats.heroStats.find(stat => stat.id === 'average').warbandStats[i]?.totalStats || 0),
			);
		}
		return [
			{ data: thisGameData, label: 'This game' },
			{ data: averageData, label: 'Hero average' },
		];
	}

	private buildChartLabels(value: BgsPostMatchStats): Label[] {
		const max: number = Math.max(
			...Object.values(value.hpOverTurn)
				.map(turnInfos => turnInfos.map(turnInfo => turnInfo.turn))
				.reduce((a, b) => a.concat(b), []),
		);
		const turns: string[] = [];
		for (let i = 0; i <= max; i++) {
			turns.push('' + i);
		}
		return turns;
	}

	private async buildChartColors(value: BgsPostMatchStats): Promise<Color[]> {
		return await Promise.all(
			Object.keys(value.hpOverTurn).map(async playerId => ({
				backgroundColor: 'rgba(255, 255, 255, 0)',
				borderColor: await ChartUtils.colorFor(playerId),
			})),
		);
	}
}
