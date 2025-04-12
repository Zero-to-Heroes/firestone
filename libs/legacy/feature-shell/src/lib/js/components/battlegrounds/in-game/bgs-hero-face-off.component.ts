import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { getHeroPower } from '@firestone-hs/reference-data';
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

	@Input() set opponent(value: FaceOffHero) {
		this.heroCardId = value.displayedCardId || value.cardId;
		this.heroPowerIcon = getHeroPower(this.heroCardId, this.allCards);
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

export interface FaceOffHero {
	cardId: string;
	displayedCardId: string;
	name: string;
	initialHealth: number;
	currentArmor: number;
	damageTaken: number;
	leaderboardPlace: number;
}
export const faceOfHeroesArrayEqual = (a: readonly FaceOffHero[], b: readonly FaceOffHero[]): boolean => {
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (!faceOffHeroesEqual(a[i], b[i])) {
			return false;
		}
	}
	return true;
};
export const faceOffHeroesEqual = (a: FaceOffHero, b: FaceOffHero): boolean => {
	return (
		a.cardId === b.cardId &&
		a.displayedCardId === b.displayedCardId &&
		a.name === b.name &&
		a.initialHealth === b.initialHealth &&
		a.currentArmor === b.currentArmor &&
		a.damageTaken === b.damageTaken &&
		a.leaderboardPlace === b.leaderboardPlace
	);
};
