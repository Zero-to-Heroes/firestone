import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'numeric-input',
	styleUrls: [
		`../../../../../../../../libs/legacy/feature-shell/src/lib/css/component/settings/settings-common.component.scss`,
		`./numeric-input.component.scss`,
	],
	template: `
		<div class="numeric-input" [ngClass]="{ disabled: disabled }">
			<div class="label" *ngIf="label" [innerHTML]="label" [helpTooltip]="labelTooltip"></div>
			<input
				type="number"
				[ngModel]="value"
				(ngModelChange)="onModelChange($event)"
				(mousedown)="preventDrag($event)"
			/>
			<!-- FIXME -->
			<!-- (dblclick)="$event.target.select()" -->
			<div class="buttons">
				<button class="arrow up" inlineSVG="assets/svg/arrow.svg" (click)="increment()"></button>
				<button class="arrow down" inlineSVG="assets/svg/arrow.svg" (click)="decrement()"></button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumericInputComponent {
	@Output() valueChange = new EventEmitter<number>();

	@Input() label: string | null;
	@Input() value: number | null;
	@Input() disabled: boolean;
	@Input() incrementStep = 1;
	@Input() minValue: number;
	@Input() labelTooltip: string | null;

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}

	onModelChange(value: number) {
		this.valueChange.next(value);
	}

	increment() {
		this.valueChange.next((this.value ?? 0) + this.incrementStep);
	}

	decrement() {
		if (this.minValue != null) {
			this.valueChange.next(Math.max(this.minValue, (this.value ?? 0) - this.incrementStep));
		} else {
			this.valueChange.next((this.value ?? 0) - this.incrementStep);
		}
	}
}
