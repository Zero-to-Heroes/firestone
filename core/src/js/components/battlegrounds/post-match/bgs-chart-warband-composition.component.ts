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
import { Race } from '@firestone-hs/reference-data';
import { Entity as ParserEntity } from '@firestone-hs/replay-parser';
import { CardsFacadeService } from '@services/cards-facade.service';
import { BgsBoard } from '../../../models/battlegrounds/in-game/bgs-board';
import { BgsPostMatchStats } from '../../../models/battlegrounds/post-match/bgs-post-match-stats';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'bgs-chart-warband-composition',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-common-chart.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-chart-warband-composition.component.scss`,
	],
	template: `
		<div class="legend" *ngIf="chartData?.length">
			<div class="item beast" *ngIf="isTribe('beast')">
				<div class="node"></div>
				{{ 'global.tribe.beast' | owTranslate }}
			</div>
			<div class="item mech" *ngIf="isTribe('mech')">
				<div class="node"></div>
				{{ 'global.tribe.mech' | owTranslate }}
			</div>
			<div class="item dragon" *ngIf="isTribe('dragon')">
				<div class="node"></div>
				{{ 'global.tribe.dragon' | owTranslate }}
			</div>
			<div class="item demon" *ngIf="isTribe('demon')">
				<div class="node"></div>
				{{ 'global.tribe.demon' | owTranslate }}
			</div>
			<div class="item murloc" *ngIf="isTribe('murloc')">
				<div class="node"></div>
				{{ 'global.tribe.murloc' | owTranslate }}
			</div>
			<div class="item pirate" *ngIf="isTribe('pirate')">
				<div class="node"></div>
				{{ 'global.tribe.pirate' | owTranslate }}
			</div>
			<div class="item elemental" *ngIf="isTribe('elemental')">
				<div class="node"></div>
				{{ 'global.tribe.elemental' | owTranslate }}
			</div>
			<div class="item quilboar" *ngIf="isTribe('quilboar')">
				<div class="node"></div>
				{{ 'global.tribe.quilboar' | owTranslate }}
			</div>
			<div class="item blank">
				<div class="node"></div>
				{{ 'battlegrounds.post-match-stats.composition.blank-tribe' | owTranslate }}
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
			<span class="title" [owTranslate]="'battlegrounds.post-match-stats.composition.empty-state-title'"></span>
			<span class="subtitle" [owTranslate]="'battlegrounds.post-match-stats.composition.empty-state-subtitle'">
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
		domain: [
			'#A2CCB0',
			'#404ED3',
			'#E9A943',
			'#A276AF',
			'#9FB6D7',
			'#43403d',
			'#DE5959',
			'#c56700',
			'#D9C3AB',
			'#D9C3AB',
		],
	};
	barPadding: number;
	loaded = false;

	@Input() invalidLimit: number;

	@Input() set availableTribes(value: readonly Race[]) {
		if (value === this._availableTribes) {
			return;
		}

		this._availableTribes = value;
		this.updateValues();
	}

	@Input() set stats(value: BgsPostMatchStats) {
		if (value === this._stats) {
			return;
		}
		if (!value?.boardHistory) {
			return;
		}

		this._stats = value;
		this.updateValues();
	}

	@Input() set visible(value: boolean) {
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
	private _availableTribes: readonly Race[];
	private boardHistory: readonly ParserEntity[];
	private _visible: boolean;
	private _dirty = true;

	constructor(
		private readonly el: ElementRef,
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly appRef: ApplicationRef,
		private readonly i18n: LocalizationFacadeService,
	) {}

	isTribe(tribe: string): boolean {
		if (!this._availableTribes?.length) {
			return true;
		}

		return this._availableTribes.includes(Race[tribe.toUpperCase()]);
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
			this._dirty = true;
			return;
		}
		if (!this._dirty) {
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

			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	axisTickFormatter(text: string): string {
		return parseInt(text).toFixed(0);
	}

	private async updateValues() {
		if (!this._stats || !this._stats.boardHistory) {
			return;
		}

		if (this.invalidLimit && this._stats.boardHistory.length <= this.invalidLimit) {
			this.chartData = [];
			this.loaded = false;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			return;
		}

		setTimeout(() => {
			this.chartData = this.buildChartData(this._stats);

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
					this.buildSeries(this.i18n.translateString('global.tribes.beast'), 'beast', history),
					this.buildSeries(this.i18n.translateString('global.tribes.mech'), 'mech', history),
					this.buildSeries(this.i18n.translateString('global.tribes.dragon'), 'dragon', history),
					this.buildSeries(this.i18n.translateString('global.tribes.demon'), 'demon', history),
					this.buildSeries(this.i18n.translateString('global.tribes.murloc'), 'murloc', history),
					this.buildSeries(this.i18n.translateString('global.tribes.pirate'), 'pirate', history),
					this.buildSeries(this.i18n.translateString('global.tribes.elemental'), 'elemental', history),
					this.buildSeries(this.i18n.translateString('global.tribes.quilboar'), 'quilboar', history),
					this.buildSeries(this.i18n.translateString('global.tribes.all'), 'all', history),
					this.buildSeries(this.i18n.translateString('global.tribes.blank'), null, history),
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
