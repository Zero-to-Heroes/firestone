import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IOption } from 'ng-select';
import { StatGameFormatType } from '../../models/mainwindow/stats/stat-game-format.type';
import { Set } from '../../models/set';
import { CollectionSetsFilterEvent } from '../../services/mainwindow/store/events/collection/collection-sets-filter-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';

@Component({
	selector: 'sets',
	styleUrls: [`../../../css/component/collection/sets.component.scss`],
	template: `
		<div class="sets">
			<filter
				[filterOptions]="filterOptions"
				[activeFilter]="activeFilter"
				[placeholder]="placeholder"
				[filterChangeFunction]="filterChangeFunction"
			></filter>
			<sets-container [sets]="sets" [category]="category"></sets-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetsComponent {
	@Input() set standardSets(value: Set[]) {
		this._standardSets = value;
		this.update();
	}

	@Input() set wildSets(value: Set[]) {
		this._wildSets = value;
		this.update();
	}

	category: string;
	sets: Set[];
	_standardSets: Set[];
	_wildSets: Set[];

	filterOptions: readonly IOption[];
	activeFilter: string;
	placeholder: string;
	filterChangeFunction: (option: IOption) => MainWindowStoreEvent;

	constructor() {
		this.filterOptions = [
			{
				label: 'Standard',
				value: 'standard',
			} as IOption,
			{
				label: 'Wild',
				value: 'wild',
			} as IOption,
			{
				label: 'All',
				value: 'all',
			} as IOption,
		];
		this.filterChangeFunction = (option: IOption) =>
			new CollectionSetsFilterEvent(option.value as StatGameFormatType);
	}

	@Input('selectedFormat') set selectedFormat(format: StatGameFormatType) {
		this.activeFilter = format;
		this.update();
	}

	private update() {
		if (!this._standardSets || !this._wildSets) {
			return;
		}
		switch (this.activeFilter) {
			case 'standard':
				this.sets = this._standardSets;
				this.category = 'Standard';
				break;
			case 'wild':
				this.sets = this._wildSets;
				this.category = 'Wild';
				break;
			case 'all':
			default:
				this.sets = [...this._wildSets, ...this._standardSets];
				this.category = 'All';
		}
	}
}
