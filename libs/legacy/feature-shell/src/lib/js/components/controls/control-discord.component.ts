import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	standalone: false,
	selector: 'control-discord',
	styleUrls: [
		`../../../css/component/controls/controls.scss`,
		`../../../css/component/controls/control-discord.component.scss`,
	],
	template: `
		<a
			href="https://discord.gg/vKeB3gnKTy"
			target="_blank"
			(mousedown)="preventMiddleClick($event)"
			(click)="preventMiddleClick($event)"
			(auxclick)="preventMiddleClick($event)"
			[attr.aria-label]="'Discord server'"
		>
			<svg class="svg-icon-fill">
				<use
					xmlns:xlink="https://www.w3.org/1999/xlink"
					xlink:href="assets/svg/sprite.svg#window-control_discord"
				></use>
			</svg>
		</a>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlDiscordComponent {
	preventMiddleClick(event: MouseEvent) {
		if (event.which === 2) {
			event.stopPropagation();
			event.preventDefault();
			return false;
		}
	}
}
