import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { IOption } from 'ng-select';
import { BgsPostMatchStatsPanel } from '../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { BgsStatsFilterId } from '../../../models/battlegrounds/post-match/bgs-stats-filter-id.type';
import { BgsPostMatchStatsFilterChangeEvent } from '../../../services/battlegrounds/store/events/bgs-post-match-stats-filter-change-event';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

declare let amplitude: any;

@Component({
	selector: 'bgs-post-match-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/post-match/bgs-post-match-stats.component.scss`,
	],
	template: `
		<div class="container">
			<div class="content">
				<ng-container [ngSwitch]="activeFilter">
					<bgs-chart-hp *ngSwitchCase="'hp-by-turn'" [stats]="_panel?.stats"> </bgs-chart-hp>
					<bgs-chart-warband-stats *ngSwitchCase="'warband-total-stats-by-turn'" [stats]="_panel">
					</bgs-chart-warband-stats>
					<bgs-chart-warband-composition
						*ngSwitchCase="'warband-composition-by-turn'"
						[stats]="_panel?.stats"
					>
					</bgs-chart-warband-composition>
					<bgs-chart-stats *ngSwitchCase="'stats'" [stats]="_panel?.stats"> </bgs-chart-stats>
				</ng-container>
				<filter
					[filterOptions]="filterOptions"
					[activeFilter]="activeFilter"
					[placeholder]="placeholder"
					[delegateFullControl]="true"
					[filterChangeFunction]="filterChangeFunction"
				></filter>
			</div>
			<div class="left"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsPostMatchStatsComponent implements AfterViewInit {
	_panel: BgsPostMatchStatsPanel;

	filterOptions: readonly IOption[] = [
		{ label: 'HP by turn', value: 'hp-by-turn' },
		{ label: 'Board total stats', value: 'warband-total-stats-by-turn' },
		{ label: 'Warband composition', value: 'warband-composition-by-turn' },
		{ label: 'Stats', value: 'stats' },
	];
	activeFilter: BgsStatsFilterId;
	placeholder = 'Select stats';
	filterChangeFunction: (option: IOption) => void;

	@Input() set panel(value: BgsPostMatchStatsPanel) {
		console.log('setting panel');
		this._panel = value;
		this.activeFilter = value.selectedStat;
		console.log('set panel');
	}

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private readonly el: ElementRef,
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
	) {
		console.log('in construftor');
	}

	async ngAfterViewInit() {
		console.log('after view init');
		// this.onResize();
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;

		this.filterChangeFunction = (option: IOption) =>
			this.battlegroundsUpdater.next(new BgsPostMatchStatsFilterChangeEvent(option.value as BgsStatsFilterId));
		console.log('filterChangeFunction', this.filterChangeFunction);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
