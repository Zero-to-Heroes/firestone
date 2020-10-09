import {
	ApplicationRef,
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
import { BgsBoard } from '../../../models/battlegrounds/in-game/bgs-board';
import { BgsPostMatchStats } from '../../../models/battlegrounds/post-match/bgs-post-match-stats';

declare let amplitude: any;

@Component({
	selector: 'bgs-chart-warband-composition',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
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
			<div class="item pirate">
				<div class="node"></div>
				Pirate
			</div>
			<div class="item elemental">
				<div class="node"></div>
				Elemental
			</div>
			<div class="item blank">
				<div class="node"></div>
				No tribe / All
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
				(activate)="onActivate($event)"
				(deactivate)="onDeactivate($event)"
			>
				<ng-template #tooltipTemplate let-model="model">
					<div class="bgs-tribe-composition-tooltip">
						<minion-icon *ngFor="let minion of model.minions" [entity]="minion"></minion-icon>
					</div>
				</ng-template>
			</ngx-charts-bar-vertical-stacked>
		</div>
	`,
	// changeDetection: ChangeDetectionStrategy.OnPush,
	changeDetection: ChangeDetectionStrategy.Default,
})
export class BgsChartWarbandCompositionComponent {
	dimensions: number[];
	chartData: object[];
	colorScheme = {
		domain: ['#A2CCB0', '#404ED3', '#E9A943', '#A276AF', '#9FB6D7', '#43403d', '#DE5959', '#D9C3AB', '#D9C3AB'],
	};
	barPadding: number;

	private _stats: BgsPostMatchStats;
	private boardHistory: readonly ParserEntity[];
	private _visible: boolean;
	private _dirty = true;

	@Input() set stats(value: BgsPostMatchStats) {
		if (value === this._stats) {
			return;
		}
		if (!value?.boardHistory) {
			return;
		}
		console.log('[warband-composition] setting value', value);
		this._stats = value;
		this.setStats(value);
	}

	@Input() set visible(value: boolean) {
		// console.log('setting visible', value);
		if (value === this._visible) {
			return;
		}
		this._visible = value;
		if (this._visible) {
			setTimeout(() => {
				this._dirty = true;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
				setTimeout(() => {
					this.doResize();
				});
			}, 1000);
		} else {
		}
	}

	constructor(
		private readonly el: ElementRef,
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: AllCardsService,
		private readonly appRef: ApplicationRef,
	) {
		allCards.initializeCardsDb();
	}

	async ngAfterViewInit() {
		// setTimeout(() => window.dispatchEvent(new Event('resize')));
	}

	onActivate(event) {
		setTimeout(() => {
			this.appRef.tick();
		}, 200);
	}

	onDeactivate(event) {
		setTimeout(() => {
			this.appRef.tick();
		}, 200);
	}

	@HostListener('window:resize')
	onResize() {
		console.log('window resize');
		this._dirty = true;
		this.doResize();
	}

	private doResize() {
		if (!this._visible) {
			console.log('not visible');
			this._dirty = true;
			return;
		}
		if (!this._dirty) {
			console.log('not dirty');
			return;
		}
		// console.log('detected resize event', this._visible, this._dirty);
		setTimeout(() => {
			// console.log('handling resize');
			const chartContainer = this.el.nativeElement.querySelector('.chart-container');
			const rect = chartContainer?.getBoundingClientRect();
			if (!rect?.width || !rect?.height) {
				setTimeout(() => {
					this.doResize();
				}, 500);
				return;
			}
			// console.log('chartContainer', chartContainer, rect, rect.width, rect.height);
			this._dirty = false;
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

	private async setStats(value: BgsPostMatchStats) {
		if (!value || !value.boardHistory) {
			this.allCards.initializeCardsDb();
			return;
		}
		// await this.allCards.initializeCardsDb();
		this.chartData = this.buildChartData(value);
		console.log('chartData', this.chartData, value?.boardHistory, value);
		this.barPadding = Math.min(40, 40 - 2 * (value.boardHistory.length - 12));
		// this.chartLabels = await this.buildChartLabels(value);
		// this.chartColors = this.buildChartColors(value);
		// console.log('built line colors', this.chartColors);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
					this.buildSeries('Beast', 'beast', history),
					this.buildSeries('Mech', 'mech', history),
					this.buildSeries('Dragon', 'dragon', history),
					this.buildSeries('Demon', 'demon', history),
					this.buildSeries('Murloc', 'murloc', history),
					this.buildSeries('Pirate', 'pirate', history),
					this.buildSeries('Elemental', 'elemental', history),
					this.buildSeries('All', 'all', history),
					this.buildSeries('No tribe', null, history),
				],
			}));
	}

	private buildSeries(tribeName: string, tribeCode: string, history: BgsBoard) {
		return {
			name: tribeName,
			tribeCode: tribeCode,
			value: this.getTribe(tribeCode, history.board),
			minions: this.getMinions(tribeCode, history.turn),
		};
	}

	private getTribe(tribe: string, board: readonly Entity[]): number {
		// Don't use === because tribe can be null / undefined
		return board.filter(entity => this.allCards.getCard(entity.cardID)?.race?.toLowerCase() == tribe).length;
	}

	private getMinions(tribe: string, turn: number, model?): readonly ParserEntity[] {
		// console.log(
		// 	'getting minions',
		// 	tribe,
		// 	turn,
		// 	this._stats?.boardHistory?.find(history => history.turn === turn)?.board,
		// 	this._stats?.boardHistory?.find(history => history.turn === turn)?.board[0].tags.toJS(),
		// );
		return (
			this._stats?.boardHistory
				?.find(history => history.turn === turn)
				?.board?.map(entity =>
					entity.tags?.merge
						? ParserEntity.create(entity as ParserEntity)
						: ParserEntity.fromJS(entity as any),
				)
				?.filter(entity => this.allCards.getCard(entity.cardID)?.race?.toLowerCase() == tribe) || []
		);
	}
}
