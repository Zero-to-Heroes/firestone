import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'bgs-plus-button',
	styleUrls: [`../../../../css/component/battlegrounds/battles/bgs-plus-button.component.scss`],
	template: `
		<div class="change-icon" inlineSVG="assets/svg/bg_plus.svg" *ngIf="!useUpdateIcon"></div>
		<div class="change-icon" inlineSVG="assets/svg/bg_rename.svg" *ngIf="useUpdateIcon"></div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsPlusButtonComponent {
	@Input() useUpdateIcon: boolean;
}
