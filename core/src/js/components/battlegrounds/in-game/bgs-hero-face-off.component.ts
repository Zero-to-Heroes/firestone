import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OpponentFaceOff } from './opponent-face-off';

declare let amplitude: any;

@Component({
	selector: 'bgs-hero-face-off',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-hero-face-off.component.scss`,
	],
	template: `
		<div class="face-off">
			<img [src]="icon" class="portrait" />
			<div class="results">
				<div class="wins">{{ wins }}</div>
				<div class="separator">-</div>
				<div class="losses">{{ losses }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroFaceOffComponent {
	icon: string;
	wins: number;
	losses: number;

	@Input() set faceOff(value: OpponentFaceOff) {
		this.icon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.cardId}.jpg`;
		this.wins = value.wins;
		this.losses = value.losses;
	}
}
