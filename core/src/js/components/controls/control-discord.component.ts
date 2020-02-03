import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'control-discord',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-discord.component.scss`,
	],
	template: `
		<a
			href="https://discord.gg/H4Hj7bC"
			target="_blank"
			(mousedown)="preventMiddleClick($event)"
			(click)="preventMiddleClick($event)"
			(auxclick)="preventMiddleClick($event)"
		>
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
export class ControlDiscordComponent {
	preventMiddleClick(event: MouseEvent) {
		// console.log('intercepting mouse click?', event);
		if (event.which === 2) {
			// console.log('preventing middle click on href, as it messes up with the windowing system');
			event.stopPropagation();
			event.preventDefault();
			return false;
		}
	}
}
