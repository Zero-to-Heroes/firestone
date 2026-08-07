import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AllCardsService, Entity } from '@firestone/replay/replay-parser';
import { formatEnchantmentText } from './enchantment-text.utils';

@Component({
	standalone: false,
	selector: 'card-enchantment',
	styleUrls: ['../../../text.scss', './card-enchantment.component.scss'],
	template: `
		<div class="card-enchantment" cardElementResize [fontSizeRatio]="0.075">
			<div class="name" resizeTarget>{{ name }}</div>
			<div class="body">
				<div class="image">
					<img class="art" src="{{ art }}" />
					<img class="ring" src="{{ ringImage }}" />
				</div>
				<div class="description" resizeTarget [innerHTML]="description"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEnchantmentComponent {
	_enchantment: Entity;
	name: string;
	art: string;
	description: string;
	ringImage = 'https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/enchantments/enchantment-ring.png';

	private _cardName: string;
	private _count = 1;

	constructor(private cards: AllCardsService) {}

	@Input() set enchantment(value: Entity) {
		// console.debug('[card-enchantment] setting enchantment', value);
		this._enchantment = value;
		const cardId = value.cardID;
		const card = this.cards.getCard(cardId);
		if (!card) {
			return;
		}
		this._cardName = card.name;
		this.updateName();
		const cardForArt = this.normalizeEnchantment(cardId);
		this.art = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardForArt}.jpg`;
		this.description = formatEnchantmentText(card.text, value);
	}

	@Input() set count(value: number) {
		this._count = value > 0 ? value : 1;
		this.updateName();
	}

	private updateName() {
		if (!this._cardName) {
			return;
		}
		this.name = this._count > 1 ? `${this._count}x ${this._cardName}` : this._cardName;
	}

	private normalizeEnchantment(cardId: string): string {
		if (!cardId?.length) {
			return cardId;
		}

		// The base case
		const regex = /(.*)e\d*$/;
		const match = regex.exec(cardId);
		if (!!match) {
			const rootCardId = match[1];
			return rootCardId;
		}
		return cardId;
	}
}
