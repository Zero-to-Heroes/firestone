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
import { IOption } from '@firestone/shared/common/view';
import { OverwolfService } from '@firestone/shared/framework/core';
import { MainWindowStoreEvent } from '../services/mainwindow/store/events/main-window-store-event';

@Component({
	standalone: false,
	selector: 'filter',
	styleUrls: [`../../css/component/filter.component.scss`],
	template: `
		<div class="filter">
			<ng-select
				class="filter"
				[options]="filterOptions"
				[ngModel]="activeFilter"
				[placeholder]="placeholder"
				(selected)="selectFilter($event?.value)"
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
export class FilterComponent implements AfterViewInit {
	@Input() filterOptions: IOption[];
	@Input() activeFilter: string;
	@Input() placeholder: string;
	@Input() delegateFullControl: boolean;
	@Input() filterChangeFunction: (option: IOption) => MainWindowStoreEvent;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private ow: OverwolfService,
		private el: ElementRef,
		private cdr: ChangeDetectorRef,
	) {}

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

	selectFilter(value: string) {
		const option = this.filterOptions.find((opt) => opt.value === value);
		if (!option) return;

		if (this.delegateFullControl) {
			this.filterChangeFunction(option);
		} else {
			this.stateUpdater.next(this.filterChangeFunction(option));
		}
	}

	refresh() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
