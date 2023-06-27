import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

declare let amplitude;

@Component({
	selector: 'control-close-simple',
	styleUrls: [
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-close.component.scss`,
	],
	template: `
		<button
			confirmationTooltip
			[askConfirmation]="requestConfirmation"
			[confirmationText]="confirmationText"
			[validButtonText]="confirmationOk"
			[cancelButtonText]="confirmationCancel"
			[confirmationPosition]="'right'"
			(onConfirm)="closeWindow()"
		>
			<svg class="svg-icon-fill">
				<use
					xmlns:xlink="https://www.w3.org/1999/xlink"
					xlink:href="assets/svg/sprite.svg#window-control_close"
				></use>
			</svg>
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlCloseSimpleComponent {
	@Output() requestClose: EventEmitter<void> = new EventEmitter<void>();

	@Input() requestConfirmation: boolean;
	@Input() confirmationText: string;
	@Input() confirmationButtons: readonly ConfirmationButton[];

	@Input() confirmationCancel: string;
	@Input() confirmationOk: string;

	async closeWindow() {
		this.requestClose.next();
	}
}

export interface ConfirmationButton {
	readonly text: string;
	readonly status: string;
}
