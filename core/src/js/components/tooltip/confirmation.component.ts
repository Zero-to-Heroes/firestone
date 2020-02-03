import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Output } from '@angular/core';

@Component({
	selector: 'confirmation',
	styleUrls: [`../../../css/component/tooltip/confirmation.component.scss`],
	template: `
		<div class="confirmation">
			<div class="title">Are you sure?</div>
			<div class="text">
				This will close the tracker for the duration of the current match
			</div>
			<div class="buttons">
				<button class="ok" (click)="ok()">Exit</button>
				<button class="cancel" (click)="cancel()">Cancel</button>
			</div>
			<button class="close-button" (click)="cancel()">
				<svg class="svg-icon-fill">
					<use
						xmlns:xlink="https://www.w3.org/1999/xlink"
						xlink:href="/Files/assets/svg/sprite.svg#window-control_close"
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

	constructor(private cdr: ChangeDetectorRef) {}

	ok() {
		this.onConfirm.next(true);
	}

	cancel() {
		this.onCancel.next(true);
	}
}
