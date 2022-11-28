import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'secondary-default',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/main-window/secondary-default.component.scss`,
	],
	template: `
		<div class="secondary-default">
			<div class="logo" inlineSVG="assets/svg/firestone_logo.svg"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecondaryDefaultComponent {}
