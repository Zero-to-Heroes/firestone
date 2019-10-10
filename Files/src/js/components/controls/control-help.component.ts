import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'control-help',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-help.component.scss`,
	],
	template: `
		<a href="https://discord.gg/H4Hj7bC" target="_blank">
			<svg class="svg-icon-fill">
				<use
					xmlns:xlink="https://www.w3.org/1999/xlink"
					xlink:href="/Files/assets/svg/sprite.svg#window-control_support"
				></use>
			</svg>
		</a>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlHelpComponent {}
