import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IOption } from 'ng-select';
import { MainWindowState } from '../models/mainwindow/main-window-state';
import { NavigationState } from '../models/mainwindow/navigation/navigation-state';

@Component({
	selector: 'fs-filter-dropdown',
	styleUrls: [`../../css/component/fs-filter-dropdown.component.scss`],
	template: `
		<filter-dropdown
			class="hero-sort-filter"
			[options]="_options"
			[filter]="filter"
			[placeholder]="placeholder"
			[visible]="visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FsFilterDropdownComponent {
	@Output() onOptionSelected: EventEmitter<IOption> = new EventEmitter<IOption>();

	@Input() filter: string;
	@Input() placeholder: string;

	@Input() set checkVisibleHandler(value: (navigation: NavigationState, state: MainWindowState) => boolean) {
		this._checkVisibleHandler = value;
		this.doSetValues();
	}

	@Input() set options(value: readonly IOption[]) {
		this._options = value;
		this.doSetValues();
	}

	@Input() set optionsBuilder(value: (navigation: NavigationState, state: MainWindowState) => readonly IOption[]) {
		this._optionsBuilder = value;
		this.doSetValues();
	}

	@Input() set state(value: MainWindowState) {
		this._state = value;
		this.doSetValues();
	}

	@Input() set navigation(value: NavigationState) {
		this._navigation = value;
		this.doSetValues();
	}

	_state: MainWindowState;
	_navigation: NavigationState;
	_options: readonly IOption[];
	_optionsBuilder: (navigation: NavigationState, state: MainWindowState) => readonly IOption[];
	_checkVisibleHandler: (navigation: NavigationState, state: MainWindowState) => boolean;

	visible: boolean;

	onSelected(option: IOption) {
		this.onOptionSelected.next(option);
	}

	private doSetValues() {
		console.log('calling checkVisibleHandler', this._navigation, this._state);
		this.visible = this._checkVisibleHandler ? this._checkVisibleHandler(this._navigation, this._state) : true;
		this._options =
			this._options ?? (this._optionsBuilder ? this._optionsBuilder(this._navigation, this._state) : []);
		if (!this.visible) {
			return;
		}
	}
}
