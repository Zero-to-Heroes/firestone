import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	standalone: false,
	selector: 'bgs-minus-button',
	styleUrls: [`./bgs-plus-button.component.scss`],
	template: ` <div class="change-icon" inlineSVG="assets/svg/bg_minus.svg"></div> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsMinusButtonComponent {}
