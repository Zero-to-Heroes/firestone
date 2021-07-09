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
import { ReplaysFilterCategoryType } from '../../models/mainwindow/replays/replays-filter-category.type';
import { ReplaysState } from '../../models/mainwindow/replays/replays-state';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { ReplaysFilterEvent } from '../../services/mainwindow/store/events/replays/replays-filter-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'replays-filter',
	styleUrls: [`../../../css/component/replays/replays-filter.component.scss`],
	template: `
		<div class="replays-filter">
			<ng-select
				class="filter"
				[options]="filterOptions"
				[ngModel]="activeFilter"
				[placeholder]="placeholder"
				(selected)="selectFilter($event)"
				(opened)="refresh()"
				(closed)="refresh()"
				[noFilter]="1"
			>
				<ng-template #optionTemplate let-option="option">
					<span>{{ option?.label }}</span>
					<i class="i-30 selected-icon" *ngIf="option.value === activeFilter">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#selected_dropdown" />
						</svg>
					</i>
				</ng-template>
			</ng-select>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplaysFilterComponent implements AfterViewInit {
	filterOptions: readonly IOption[];
	activeFilter: string;
	placeholder: string;

	private category: ReplaysFilterCategoryType;
	private replaysState: ReplaysState;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	@Input() set filterCategory(value: ReplaysFilterCategoryType) {
		this.category = value;
		this.updateFilters();
	}

	@Input() set state(value: ReplaysState) {
		this.replaysState = value;
		this.updateFilters();
	}

	constructor(private ow: OverwolfService, private el: ElementRef, private cdr: ChangeDetectorRef) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		const singleEls: HTMLElement[] = this.el.nativeElement.querySelectorAll('.single');
		singleEls.forEach((singleEl) => {
			const caretEl = singleEl.appendChild(document.createElement('i'));
			caretEl.innerHTML = `<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#arrow"/>
				</svg>`;
			caretEl.classList.add('i-30');
			caretEl.classList.add('caret');
		});

		setTimeout(() => {
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
	}

	selectFilter(option: IOption) {
		this.stateUpdater.next(new ReplaysFilterEvent(this.category, option.value));
	}

	refresh() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private updateFilters() {
		// console.log('updating filters', this.category, this.replaysState);
		if (!this.category || !this.replaysState) {
			return;
		}
		const filter = this.replaysState.getFilter(this.category);
		this.filterOptions = filter.options;
		this.activeFilter = filter.selectedOption;
		const placeholder =
			this.filterOptions && this.filterOptions.length > 0 && this.activeFilter
				? this.filterOptions.find((option) => option.value === this.activeFilter)?.label
				: null;
		this.placeholder = placeholder ?? filter.placeholder;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
