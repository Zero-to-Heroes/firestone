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
import { CARDS_VERSION } from '../../../services/hs-utils';

@Component({
	selector: 'bgs-chart-warband-composition',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-common-chart.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-chart-warband-composition.component.scss`,
	],
	template: `
		<div class="legend" *ngIf="chartData?.length">
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
		<div class="chart-container" *ngIf="chartData?.length">
			<ngx-charts-bar-vertical-stacked
				*ngIf="loaded"
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
				[yScaleMax]="7"
				[showGridLines]="true"
				[rotateXAxisTicks]="false"
				[barPadding]="barPadding"
				[animations]="false"
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
		<div class="content empty-state" *ngIf="!chartData?.length">
			<i>
				<svg>
					<use xlink:href="assets/svg/sprite.svg#empty_state_tracker" />
				</svg>
			</i>
			<span class="title">No information available</span>
			<span class="subtitle"
				>Older games, or very long games, don't have the turn-by-turn composition stored.
			</span>
		</div>
	`,
	// changeDetection: ChangeDetectionStrategy.OnPush,
	changeDetection: ChangeDetectionStrategy.Default,
})
export class BgsChartWarbandCompositionComponent {
	dimensions: number[];
	chartData: any[];
	colorScheme = {
		domain: ['#A2CCB0', '#404ED3', '#E9A943', '#A276AF', '#9FB6D7', '#43403d', '#DE5959', '#D9C3AB', '#D9C3AB'],
	};
	barPadding: number;
	loaded = false;

	@Input() invalidLimit: number;

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

	private _stats: BgsPostMatchStats;
	private boardHistory: readonly ParserEntity[];
	private _visible: boolean;
	private _dirty = true;

	constructor(
		private readonly el: ElementRef,
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: AllCardsService,
		private readonly appRef: ApplicationRef,
	) {
		allCards.initializeCardsDb(CARDS_VERSION);
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
		setTimeout(() => {
			const chartContainer = this.el.nativeElement.querySelector('.chart-container');
			const rect = chartContainer?.getBoundingClientRect();
			if (!rect?.width || !rect?.height) {
				setTimeout(() => {
					this.doResize();
				}, 500);
				return;
			}
			this._dirty = false;
			this.dimensions = [rect.width, rect.height - 15];
			this.barPadding = Math.max(25 - this.chartData.length, Math.min(40, 40 - 2 * this.chartData.length));
			this.loaded = this.dimensions?.length > 0 && this.chartData?.length > 0;
			// console.debug('dimensions', this.dimensions, this.barPadding);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	axisTickFormatter(text: string): string {
		return parseInt(text).toFixed(0);
	}

	private async setStats(value: BgsPostMatchStats) {
		if (!value || !value.boardHistory) {
			this.allCards.initializeCardsDb(CARDS_VERSION);
			return;
		}
		if (this.invalidLimit && value.boardHistory.length <= this.invalidLimit) {
			this.chartData = [];
			this.loaded = false;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			return;
		}

		setTimeout(() => {
			this.chartData = this.buildChartData(value);
			// console.debug('chart data', this.chartData);
			this.loaded = this.dimensions?.length > 0 && this.chartData?.length > 0;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 200);
	}

	private buildChartData(value: BgsPostMatchStats): any[] {
		if (!value || !value.boardHistory) {
			return null;
		}
		const history = [...value.boardHistory];
		if (history.length < 7) {
			const length = history.length;
			for (let i = length; i < 7; i++) {
				history.push({
					turn: i,
					board: [],
				});
			}
		}
		return history
			.filter((history) => history.turn > 0)
			.map((history) => ({
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
		return (
			board?.filter((entity) => this.allCards.getCard(entity.cardID)?.race?.toLowerCase() == tribe)?.length ?? 0
		);
	}

	private getMinions(tribe: string, turn: number, model?): readonly ParserEntity[] {
		return (
			this._stats?.boardHistory
				?.find((history) => history.turn === turn)
				?.board?.map((entity) =>
					entity.tags?.merge
						? ParserEntity.create(entity as ParserEntity)
						: ParserEntity.fromJS(entity as any),
				)
				?.filter((entity) => this.allCards.getCard(entity.cardID)?.race?.toLowerCase() == tribe) || []
		);
	}
}
