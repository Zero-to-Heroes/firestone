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
			<!--<ul class="menu-selection">
				<li [ngClass]="{ 'active': showStandard }" (mousedown)="toggleStandard()">Standard</li>
				<li [ngClass]="{ 'active': showWild }" (mousedown)="toggleWild()">Wild</li>
			</ul> -->
			<sets-container [sets]="standardSets" [category]="'Standard'" *ngIf="showStandard"></sets-container>
			<sets-container [sets]="wildSets" [category]="'Wild'" *ngIf="showWild"></sets-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetsComponent {
	@Input() standardSets: Set[];
	@Input() wildSets: Set[];

	filterOptions: readonly IOption[];
	activeFilter: string;
	placeholder: string;
	filterChangeFunction: (option: IOption) => MainWindowStoreEvent;

	showStandard = true;
	showWild = false;

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
		];
		this.filterChangeFunction = (option: IOption) =>
			new CollectionSetsFilterEvent(option.value as StatGameFormatType);
	}

	@Input('selectedFormat') set selectedFormat(format: StatGameFormatType) {
		this.activeFilter = format;
		switch (format) {
			case 'standard':
				this.showStandard = true;
				this.showWild = false;
				break;
			case 'wild':
				this.showStandard = false;
				this.showWild = true;
				break;
			default:
				this.showStandard = true;
				this.showWild = false;
		}
	}
}
