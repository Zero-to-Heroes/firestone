import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	standalone: false,
	selector: 'secondary-default',
	styleUrls: [`../../../css/component/main-window/secondary-default.component.scss`],
	template: `
		<div class="secondary-default">
			<div class="logo" inlineSVG="assets/svg/firestone_logo.svg"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecondaryDefaultComponent {}
