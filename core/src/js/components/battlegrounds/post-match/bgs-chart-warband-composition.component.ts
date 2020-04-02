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

declare let amplitude: any;

@Component({
	selector: 'bgs-chart-warband-composition',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-chart-warband-composition.component.scss`,
	],
	template: `
		<div class="chart-container">
			<div style="display: block;">
				<canvas
					baseChart
					*ngIf="chartData"
					[style.width.px]="chartWidth"
					[style.height.px]="chartHeight"
					[datasets]="chartData"
					[labels]="chartLabels"
					[options]="chartOptions"
					[colors]="chartColors"
					[legend]="true"
					[chartType]="'bar'"
				></canvas>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsChartWarbandCompositionComponent {
	chartWidth: number;
	chartHeight: number;
	chartData: ChartDataSets[];
	chartLabels: Label[];
	chartOptions: ChartOptions = {
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
	chartColors: Color[] = [];

	@Input() set stats(value: BgsPostMatchStats) {
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

	private async setStats(value: BgsPostMatchStats) {
		this.chartData = await this.buildChartData(value);
		this.chartLabels = await this.buildChartLabels(value);
		this.chartColors = []; // await this.buildChartColors(value);
		console.log('built line colors', this.chartColors);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildChartData(value: BgsPostMatchStats): ChartDataSets[] {
		const beastValues = value.compositionsOverTurn.map(turnCompo => turnCompo.beast);
		const mechValues = value.compositionsOverTurn.map(turnCompo => turnCompo.mech);
		const dragonValues = value.compositionsOverTurn.map(turnCompo => turnCompo.dragon);
		const demonValues = value.compositionsOverTurn.map(turnCompo => turnCompo.demon);
		const murlocValues = value.compositionsOverTurn.map(turnCompo => turnCompo.murloc);
		const blankValues = value.compositionsOverTurn.map(turnCompo => turnCompo.blank);
		return [
			{
				data: beastValues,
				label: 'Beast',
				stack: 'a',
			},
			{
				data: mechValues,
				label: 'Mech',
				stack: 'a',
			},
			{
				data: dragonValues,
				label: 'Dragon',
				stack: 'a',
			},
			{
				data: demonValues,
				label: 'Demon',
				stack: 'a',
			},
			{
				data: murlocValues,
				label: 'Murloc',
				stack: 'a',
			},
			{
				data: blankValues,
				label: 'No tribe',
				stack: 'a',
			},
		];
	}

	private buildChartLabels(value: BgsPostMatchStats): Label[] {
		return value.compositionsOverTurn.map(value => '' + value.turn);
	}

	// private async buildChartColors(value: BgsPostMatchStats): Promise<Color[]> {
	// 	return await Promise.all(
	// 		Object.keys(value.hpOverTurn).map(async playerId => ({
	// 			backgroundColor: 'rgba(255, 255, 255, 0)',
	// 			borderColor: await ChartUtils.colorFor(playerId),
	// 		})),
	// 	);
	// }
}
