import { Component, ViewEncapsulation, ChangeDetectionStrategy } from '@angular/core';

@Component({
	selector: 'control-help',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-help.component.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<a class="i-30 pink-button" href="https://discord.gg/H4Hj7bC" target="_blank">
			<svg class="svg-icon-fill">
				<use
					xmlns:xlink="http://www.w3.org/1999/xlink"
					xlink:href="/Files/assets/svg/sprite.svg#window-control_support"
				></use>
			</svg>
		</a>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlHelpComponent {}
