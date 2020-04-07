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
		<div class="face-off entry" [ngClass]="{ 'highlighted': isNextOpponent }">
			<div class="hero">
				<bgs-hero-portrait
					class="portrait"
					[icon]="icon"
					[health]="health"
					[maxHealth]="maxHealth"
					[cardTooltip]="heroPowerIcon"
					[cardTooltipText]="name"
					[cardTooltipClass]="'bgs-hero-power'"
				></bgs-hero-portrait>
			</div>
			<div class="won">{{ wins }}</div>
			<div class="lost">{{ losses }}</div>
			<div class="tied">{{ ties }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroFaceOffComponent {
	icon: string;
	heroPowerIcon: string;
	name: string;
	health: number;
	maxHealth: number;
	wins: number;
	losses: number;
	ties: number;
	isNextOpponent: boolean;

	@Input() set faceOff(value: OpponentFaceOff) {
		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.cardId}.png`;
		this.heroPowerIcon = value.heroPowerCardId;
		this.name = value.name;
		this.wins = value.wins;
		this.losses = value.losses;
		this.ties = value.ties;
		this.health = value.health;
		this.maxHealth = value.maxHealth;
		this.isNextOpponent = value.isNextOpponent;
	}
}
