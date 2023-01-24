import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardType } from '@firestone-hs/reference-data';

@Component({
	selector: 'card-art',
	styleUrls: ['./card-art.component.scss'],
	template: ` <img src="{{ image }}" class="card-art {{ _cardType }}" /> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardArtComponent {
	image: string;
	_cardType: string;

	@Input() set cardId(cardId: string | undefined) {
		// console.debug('[card-art] setting cardId', cardId);
		this.image = cardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`
			: `https://static.zerotoheroes.com/hearthstone/asset/manastorm/card_unknown.png`;
	}

	@Input() set cardType(cardType: CardType | undefined) {
		// console.debug('[card-art] setting cardType', cardType);
		this._cardType = cardType ? CardType[cardType]?.toLowerCase() : 'unknown';
	}
}
