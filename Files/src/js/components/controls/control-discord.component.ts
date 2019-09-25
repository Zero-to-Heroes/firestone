import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
	selector: 'control-discord',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-discord.component.scss`,
	],
	encapsulation: ViewEncapsulation.None,
	template: `
		<a class="i-30 pink-button" href="https://discord.gg/H4Hj7bC" target="_blank">
			<svg class="svg-icon-fill">
				<use
					xmlns:xlink="https://www.w3.org/1999/xlink"
					xlink:href="/Files/assets/svg/sprite.svg#window-control_discord"
				></use>
			</svg>
		</a>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlDiscordComponent {}
