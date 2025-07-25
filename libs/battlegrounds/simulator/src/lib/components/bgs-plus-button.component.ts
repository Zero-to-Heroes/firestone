import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	standalone: false,
	selector: 'bgs-plus-button',
	styleUrls: [`./bgs-plus-button.component.scss`],
	template: `
		<div class="change-icon" inlineSVG="assets/svg/bg_plus.svg" *ngIf="!useUpdateIcon"></div>
		<div class="change-icon update" inlineSVG="assets/svg/bg_replace.svg" *ngIf="useUpdateIcon"></div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsPlusButtonComponent {
	@Input() useUpdateIcon: boolean;
}
