import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardClass, GameTag } from '@firestone-hs/reference-data';
import { AllCardsService, Entity } from '@firestone-hs/replay-parser';

@Component({
	selector: 'secret',
	styleUrls: ['./secret.component.scss'],
	template: `
		<div class="secret" cardTooltip [tooltipEntity]="_entity" [attr.data-entity-id]="entityId">
			<img class="secret-image" src="{{ image }}" />
			<img class="question-mark" src="{{ markImage }}" />
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecretComponent {
	_entity: Entity;
	entityId: number;
	image: string | undefined;
	markImage = 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/secrets/secret_question_mark.png';

	constructor(private cards: AllCardsService) {}

	@Input() set entity(value: Entity) {
		// console.debug('[secret] setting new entity', value, value.tags.toJS());
		this._entity = value;
		this.image = undefined;
		if (value) {
			this.entityId = value.id;
			const playerClass: number = value.getTag(GameTag.CLASS);
			const isSidequest = value.getTag(GameTag.SIDEQUEST) > 0;
			if (playerClass) {
				this.image = this.buildImage(playerClass, isSidequest);
				this.markImage = this.buildMark(playerClass, isSidequest);
			} else if (value.cardID) {
				const card = this.cards.getCard(value.cardID);
				this.image = this.buildImage(CardClass[card.cardClass], isSidequest);
				this.markImage = this.buildMark(CardClass[card.cardClass], isSidequest);
			} else {
				console.error('[secret] Could not assign player class', value, value.tags.toJS());
			}
		}
	}

	private buildImage(playerClass: CardClass, isSidequest: boolean): string {
		const prefix = isSidequest ? 'sidequest' : 'secret';
		switch (playerClass) {
			case CardClass.HUNTER:
				return this.getImage(`${prefix}_hunter`);
			case CardClass.MAGE:
				return this.getImage(`${prefix}_mage`);
			case CardClass.PALADIN:
				return this.getImage(`${prefix}_paladin`);
			case CardClass.ROGUE:
				return this.getImage(`${prefix}_rogue`);
			case CardClass.DRUID:
				return this.getImage(`${prefix}_druid`);
			case CardClass.NEUTRAL:
			default:
				return this.getImage(`${prefix}_rogue`);
		}
	}

	private buildMark(playerClass: CardClass, isSidequest: boolean): string {
		if (!isSidequest) {
			return 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/secrets/secret_question_mark.png';
		}
		return 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/secrets/quest_bang.png';
	}

	private getImage(image: string) {
		return `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/secrets/${image}.png`;
	}
}
