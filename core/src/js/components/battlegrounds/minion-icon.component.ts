import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameTag } from '@firestone-hs/reference-data';
import { AllCardsService, Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'minion-icon',
	styleUrls: [`../../../css/component/battlegrounds/minion-icon.component.scss`],
	template: `
		<div class="minion-icon" [ngClass]="{ 'premium': premium }">
			<img [src]="icon" class="icon" />
			<tavern-level-icon [level]="tavernTier" class="tavern"></tavern-level-icon>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MinionIconComponent {
	// cardId: string;
	premium: boolean;
	tavernTier: number;
	icon: string;

	private _entity: Entity;

	@Input() set entity(value: Entity) {
		this._entity = value;
		// this.cardId = value.cardID;
		this.premium = value.getTag(GameTag.PREMIUM) === 1;
		this.tavernTier = this.allCards.getCard(value.cardID)?.techLevel;
		this.icon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.cardID}.jpg`;
	}

	constructor(private readonly allCards: AllCardsService) {}
}
