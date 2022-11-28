import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'bgs-minus-button',
	styleUrls: [`../../../../css/component/battlegrounds/battles/bgs-plus-button.component.scss`],
	template: ` <div class="change-icon" inlineSVG="assets/svg/bg_minus.svg"></div> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsMinusButtonComponent {}
