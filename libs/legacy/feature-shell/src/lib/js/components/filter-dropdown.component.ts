import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { IOption } from 'ng-select';

@Component({
	selector: 'filter-dropdown',
	styleUrls: [`../../css/component/filter-dropdown.component.scss`],
	template: `
		<ng-select
			*ngIf="_visible"
			class="filter hero-sort-filter"
			[options]="options"
			[ngModel]="_filter"
			[placeholder]="placeholder"
			(selected)="select($event)"
			(opened)="refresh()"
			(closed)="refresh()"
			[noFilter]="1"
		>
			<ng-template #optionTemplate let-option="option">
				<span
					[helpTooltip]="option.label"
					[ngClass]="{ unselectable: option?.unselectable }"
					[innerHTML]="option?.label"
				></span>
				<div class="tooltip" *ngIf="option?.tooltip" [helpTooltip]="option.tooltip">
					<svg>
						<use xlink:href="assets/svg/sprite.svg#info" />
					</svg>
				</div>
				<i class="i-30 selected-icon" *ngIf="option.value === _filter">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#selected_dropdown" />
					</svg>
				</i>
			</ng-template>
		</ng-select>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterDropdownComponent implements AfterViewInit {
	@Output() onOptionSelected: EventEmitter<IOption> = new EventEmitter<IOption>();

	@Input() options: IOption[];
	@Input() placeholder: string;

	@Input() set filter(value: string) {
		this._filter = value;
		// Don't know why this is required, but it is.
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set visible(value: boolean) {
		this._visible = value;
		if (value) {
			setTimeout(() => {
				this.addCarets();
			});
		}
	}

	_visible: boolean;
	_filter: string;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly el: ElementRef) {}

	refresh() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit() {
		this.addCarets();
	}

	private addCarets() {
		const carets = this.el.nativeElement.querySelectorAll('.single .caret');

		if (!!carets?.length) {
			return;
		}

		const singleEls: HTMLElement[] = this.el.nativeElement.querySelectorAll('.single');

		singleEls.forEach((singleEl) => {
			const caretEl = singleEl.appendChild(document.createElement('i'));
			caretEl.innerHTML = `<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#arrow"/>
				</svg>`;
			caretEl.classList.add('i-30');
			caretEl.classList.add('caret');
		});
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	select(option: IOption) {
		this.onOptionSelected.next(option);
	}
}
