import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'bgs-plus-button',
	styleUrls: [`../../../../css/component/battlegrounds/battles/bgs-plus-button.component.scss`],
	template: `
		<div class="change-icon" inlineSVG="assets/svg/bg_plus.svg" *ngIf="!useUpdateIcon"></div>
		<div class="change-icon update" inlineSVG="assets/svg/bg_replace.svg" *ngIf="useUpdateIcon"></div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsPlusButtonComponent {
	@Input() useUpdateIcon: boolean;
}
