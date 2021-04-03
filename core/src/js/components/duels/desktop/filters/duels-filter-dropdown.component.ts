import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { IOption } from 'ng-select';
import { MainWindowState } from '../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../models/mainwindow/navigation/navigation-state';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { DuelsDropdownOption } from './duels-dropdown-option';

@Component({
	selector: 'duels-filter-dropdown',
	styleUrls: [
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/duels/desktop/filters/duels-filter-dropdown.component.scss`,
	],
	template: `
		<fs-filter-dropdown
			[options]="options"
			[optionsBuilder]="optionsBuilder"
			[filter]="filter"
			[checkVisibleHandler]="visibleHandler"
			[state]="_state"
			[navigation]="_navigation"
			(onOptionSelected)="select($event)"
		></fs-filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsFilterDropdownComponent implements AfterViewInit {
	@Input() set state(value: MainWindowState) {
		this._state = value;
		this.doSetValues();
	}

	@Input() set navigation(value: NavigationState) {
		this._navigation = value;
		this.doSetValues();
	}

	@Input() set option(value: DuelsDropdownOption) {
		this._option = value;
		this.doSetValues();
	}

	_state: MainWindowState;
	_navigation: NavigationState;
	_option: DuelsDropdownOption;

	options: readonly IOption[];
	optionsBuilder: (navigation: NavigationState, state: MainWindowState) => readonly IOption[];
	filter: string;
	visibleHandler: (navigation: NavigationState, state: MainWindowState) => boolean;
	selectHandler: (stateUpdater: EventEmitter<MainWindowStoreEvent>, selectedOption: IOption) => void;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private doSetValues() {
		if (!this._state || !this._navigation || !this._option) {
			return;
		}

		this.options = this._option.options;
		this.optionsBuilder = this._option.optionsBuilder;
		this.filter = this._option.activeFilterHandler(this._state);
		this.visibleHandler = this._option.visibleHandler;
		this.selectHandler = this._option.selectHandler;
	}

	select(option: IOption) {
		// console.log('selecting', option);
		if (this.selectHandler) {
			this.selectHandler(this.stateUpdater, option);
		}
	}
}
