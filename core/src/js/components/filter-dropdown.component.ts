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
			class="filter hero-sort-filter"
			[ngClass]="{ 'disabled': !visible }"
			[options]="options"
			[ngModel]="filter"
			[placeholder]="placeholder"
			(selected)="select($event)"
			(opened)="refresh()"
			(closed)="refresh()"
			[noFilter]="1"
		>
			<ng-template #optionTemplate let-option="option">
				<span [helpTooltip]="option.label">{{ option?.label }}</span>
				<div class="tooltip" *ngIf="option?.tooltip" [helpTooltip]="option.tooltip">
					<svg>
						<use xlink:href="assets/svg/sprite.svg#info" />
					</svg>
				</div>
				<i class="i-30 selected-icon" *ngIf="option.value === filter">
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
	@Input() options: readonly IOption[];
	@Input() visible: boolean;
	@Input() placeholder: string;
	@Input() filter: string;

	@Output() onOptionSelected: EventEmitter<IOption> = new EventEmitter<IOption>();

	constructor(private readonly cdr: ChangeDetectorRef, private readonly el: ElementRef) {}

	refresh() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit() {
		const singleEls: HTMLElement[] = this.el.nativeElement.querySelectorAll('.single');
		// console.log('updating filter visuals', singleEls, this);
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
