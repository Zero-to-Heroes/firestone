import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
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
		// console.log('setting options builder');
		this.doSetValues();
	}

	@Input() set state(value: MainWindowState) {
		this._state = value;
		// console.log('setting state', this._state);
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

	constructor(private readonly cdr: ChangeDetectorRef) {}

	onSelected(option: IOption) {
		this.onOptionSelected.next(option);
	}

	private doSetValues() {
		// console.log(
		// 	'calling checkVisibleHandler',
		// 	this._options,
		// 	this._optionsBuilder,
		// 	this._optionsBuilder && this._optionsBuilder(this._navigation, this._state),
		// 	this._navigation,
		// 	this._state,
		// );
		this.visible = this._checkVisibleHandler ? this._checkVisibleHandler(this._navigation, this._state) : true;
		if (!this.visible) {
			return;
		}

		this._options =
			this._options && this._options.length > 0
				? this._options
				: this._optionsBuilder
				? this._optionsBuilder(this._navigation, this._state)
				: [];
		const placeholder =
			this._options && this._options.length > 0 && this.filter
				? this._options.find(option => option.value === this.filter)?.label
				: this.placeholder;
		this.placeholder = placeholder ?? this.placeholder;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
