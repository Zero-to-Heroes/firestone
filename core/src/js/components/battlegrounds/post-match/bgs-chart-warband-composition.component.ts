import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostListener,
	Input,
	ViewRef,
} from '@angular/core';
import { Entity } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { AllCardsService, Entity as ParserEntity } from '@firestone-hs/replay-parser';
import { BgsPostMatchStats } from '../../../models/battlegrounds/post-match/bgs-post-match-stats';

declare let amplitude: any;

@Component({
	selector: 'bgs-chart-warband-composition',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-common-chart.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-chart-warband-composition.component.scss`,
	],
	template: `
		<div class="legend">
			<div class="item beast">
				<div class="node"></div>
				Beast
			</div>
			<div class="item mech">
				<div class="node"></div>
				Mech
			</div>
			<div class="item dragon">
				<div class="node"></div>
				Dragon
			</div>
			<div class="item demon">
				<div class="node"></div>
				Demon
			</div>
			<div class="item murloc">
				<div class="node"></div>
				Murloc
			</div>
			<div class="item blank">
				<div class="node"></div>
				No tribe
			</div>
		</div>
		<div class="chart-container">
			<ngx-charts-bar-vertical-stacked
				[view]="dimensions"
				[results]="chartData"
				[scheme]="colorScheme"
				[legend]="false"
				[xAxis]="true"
				[trimXAxisTicks]="false"
				[xAxisTickFormatting]="axisTickFormatter"
				[yAxis]="true"
				[trimYAxisTicks]="false"
				[yAxisTicks]="[0, 1, 2, 3, 4, 5, 6, 7]"
				[yAxisTickFormatting]="axisTickFormatter"
				[showGridLines]="true"
				[rotateXAxisTicks]="false"
				[barPadding]="barPadding"
			>
				<ng-template #tooltipTemplate let-model="model">
					<div class="bgs-tribe-composition-tooltip">
						<minion-icon
							*ngFor="let minion of getMinions(model.tribeCode, model.series)"
							[entity]="minion"
						></minion-icon>
					</div>
				</ng-template>
			</ngx-charts-bar-vertical-stacked>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsChartWarbandCompositionComponent {
	dimensions: number[];
	chartData: object[];
	colorScheme = {
		domain: ['#A2CCB0', '#404ED3', '#E9A943', '#A276AF', '#9FB6D7', '#D9C3AB'],
	};
	barPadding: number;

	private _stats: BgsPostMatchStats;
	private boardHistory: readonly ParserEntity[];

	@Input() set stats(value: BgsPostMatchStats) {
		if (value === this._stats) {
			return;
		}
		if (!value?.boardHistory) {
			return;
		}
		// console.log('[warband-composition] setting value', value);
		this._stats = value;
		this.setStats(value);
		window.dispatchEvent(new Event('resize'));
	}

	constructor(
		private readonly el: ElementRef,
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: AllCardsService,
	) {
		allCards.initializeCardsDb();
	}

	async ngAfterViewInit() {
		// this.onResize();
	}

	@HostListener('window:resize')
	onResize() {
		// console.log('detected resize event');
		setTimeout(() => {
			const chartContainer = this.el.nativeElement.querySelector('.chart-container');
			const rect = chartContainer?.getBoundingClientRect();
			if (!rect?.width || !rect?.height) {
				setTimeout(() => {
					this.onResize();
				}, 500);
				return;
			}
			// console.log('chartContainer', chartContainer, rect, rect.width, rect.height);
			this.dimensions = [rect.width, rect.height - 15];
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	axisTickFormatter(text: string): string {
		// console.log('formatting', text);

		return parseInt(text).toFixed(0);
	}

	getMinions(tribe: string, turn: number): readonly ParserEntity[] {
		return this._stats.boardHistory
			.find(history => history.turn === turn)
			.board.map(entity => ParserEntity.create(entity as ParserEntity))
			.filter(entity => this.allCards.getCard(entity.cardID)?.race?.toLowerCase() == tribe);
	}

	private async setStats(value: BgsPostMatchStats) {
		if (!value || !value.boardHistory) {
			this.allCards.initializeCardsDb();
			return;
		}
		// await this.allCards.initializeCardsDb();
		this.chartData = this.buildChartData(value);
		// console.log('chartData', this.chartData, value?.boardHistory);
		this.barPadding = Math.min(40, 40 - 2 * (value.boardHistory.length - 12));
		// this.chartLabels = await this.buildChartLabels(value);
		// this.chartColors = this.buildChartColors(value);
		// console.log('built line colors', this.chartColors);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		// this.onResize();
	}

	private buildChartData(value: BgsPostMatchStats): object[] {
		if (!value || !value.boardHistory) {
			return null;
		}
		return value.boardHistory
			.filter(history => history.turn > 0)
			.map(history => ({
				name: history.turn,
				series: [
					{
						name: 'Beast',
						tribeCode: 'beast',
						value: this.getTribe('beast', history.board),
					},
					{
						name: 'Mech',
						tribeCode: 'mech',
						value: this.getTribe('mech', history.board),
					},
					{
						name: 'Dragon',
						tribeCode: 'dragon',
						value: this.getTribe('dragon', history.board),
					},
					{
						name: 'Demon',
						tribeCode: 'demon',
						value: this.getTribe('demon', history.board),
					},
					{
						name: 'Murloc',
						tribeCode: 'murloc',
						value: this.getTribe('murloc', history.board),
					},
					{
						name: 'No tribe',
						tribeCode: null,
						value: this.getTribe(null, history.board),
					},
				],
			}));
	}

	private getTribe(tribe: string, board: readonly Entity[]): number {
		// Don't use === because tribe can be null / undefined
		return board.filter(entity => this.allCards.getCard(entity.cardID)?.race?.toLowerCase() == tribe).length;
	}
}
