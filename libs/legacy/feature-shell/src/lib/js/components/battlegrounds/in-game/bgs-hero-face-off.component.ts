import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { BgsPlayer } from '@firestone/battlegrounds/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';

@Component({
	selector: 'bgs-hero-face-off',
	styleUrls: [`../../../../css/component/battlegrounds/in-game/bgs-hero-face-off.component.scss`],
	template: `
		<div class="face-off entry" [ngClass]="{ highlighted: isNextOpponent }">
			<div class="hero">
				<bgs-hero-portrait
					class="portrait"
					[heroCardId]="heroCardId"
					[health]="health"
					[maxHealth]="maxHealth"
					[cardTooltip]="heroPowerIcon"
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
	heroCardId: string;
	// icon: string;
	heroPowerIcon: string;
	name: string;
	health: number;
	maxHealth: number;
	wins: number;
	losses: number;
	ties: number;

	@Input() isNextOpponent: boolean;

	@Input() set opponent(value: BgsPlayer) {
		this.heroCardId = value.getDisplayCardId();
		this.heroPowerIcon = value.getDisplayHeroPowerCardId(this.allCards);
		this.name = value.name;
		this.health = Math.max(value.initialHealth + value.currentArmor - value.damageTaken, 0);
		this.maxHealth = value.initialHealth;
	}

	@Input() set faceOffs(value: readonly BgsFaceOff[]) {
		this.wins = value?.filter((faceOff) => faceOff.result === 'won').length || 0;
		this.losses = value?.filter((faceOff) => faceOff.result === 'lost').length || 0;
		this.ties = value?.filter((faceOff) => faceOff.result === 'tied').length || 0;
	}

	constructor(private readonly allCards: CardsFacadeService) {}
}
