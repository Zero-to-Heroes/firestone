import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'confirmation',
	styleUrls: [`../../../css/component/tooltip/confirmation.component.scss`],
	template: `
		<div class="confirmation">
			<div class="title">{{ confirmationTitle }}</div>
			<div class="text">
				{{ confirmationText }}
			</div>
			<div class="buttons">
				<button class="ok" (click)="ok()">{{ validButtonText }}</button>
				<button class="cancel" (click)="cancel()">{{ cancelButtonText }}</button>
			</div>
			<button class="close-button" (click)="cancel()">
				<svg class="svg-icon-fill">
					<use
						xmlns:xlink="https://www.w3.org/1999/xlink"
						xlink:href="assets/svg/sprite.svg#window-control_close"
					></use>
				</svg>
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationComponent {
	@Output() onConfirm: EventEmitter<boolean> = new EventEmitter<boolean>();
	@Output() onCancel: EventEmitter<boolean> = new EventEmitter<boolean>();

	@Input() confirmationTitle = 'Are you sure?';
	@Input() confirmationText = 'This will close the tracker for the duration of the current match';
	@Input() validButtonText = 'Exit';
	@Input() cancelButtonText = 'Cancel';

	constructor(private cdr: ChangeDetectorRef) {}

	ok() {
		this.onConfirm.next(true);
	}

	cancel() {
		this.onCancel.next(true);
	}
}
