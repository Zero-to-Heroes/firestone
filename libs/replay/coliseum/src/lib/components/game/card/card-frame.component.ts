import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardClass, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';

@Component({
	standalone: false,
	selector: 'card-frame',
	styleUrls: ['./card-frame.component.scss'],
	template: ` <img src="{{ image }}" class="card-frame" /> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardFrameComponent {
	image: string;

	private _cardId: string;
	private _premium: boolean;

	constructor(private cards: AllCardsService) {}

	@Input() set cardId(cardId: string) {
		// console.debug('[card-frame] setting cardId', cardId);
		this._cardId = cardId;
		this.updateImage();
	}

	@Input() set premium(premium: boolean | undefined) {
		// console.debug('[card-frame] setting premium', premium);
		this._premium = premium ?? false;
		this.updateImage();
	}

	private updateImage() {
		if (!this._cardId) {
			return;
		}
		const originalCard = this.cards.getCard(this._cardId);
		const cardClass: CardClass = this.buildPlayerClass(originalCard);
		const cardType: CardType =
			originalCard && originalCard.type ? CardType[originalCard.type.toUpperCase() as string] : undefined;
		const frame: string = this.buildFrame(cardClass, cardType, this._premium);
		this.image = `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/card/${frame}.png?v=3`;
	}

	private buildPlayerClass(originalCard: ReferenceCard): CardClass {
		const cardClass: CardClass = originalCard?.classes?.length
			? CardClass[originalCard.classes[0]]
			: CardClass.NEUTRAL;
		// Ysera
		return cardClass === CardClass.DREAM ? CardClass.HUNTER : cardClass;
	}

	private buildFrame(cardClass: CardClass, cardType: CardType, premium: boolean): string {
		const strClass =
			cardType === CardType.HERO_POWER ? '' : premium ? '-premium' : '-' + CardClass[cardClass]?.toLowerCase();
		const updatedCardType =
			cardType === CardType.BATTLEGROUND_SPELL ||
			cardType === CardType.BATTLEGROUND_QUEST_REWARD ||
			cardType === CardType.BATTLEGROUND_ANOMALY ||
			cardType === CardType.BATTLEGROUND_TRINKET
				? CardType.SPELL
				: cardType;
		const strFrame = CardType[updatedCardType] ? CardType[updatedCardType]?.toLowerCase() : 'neutral';
		return `frame-${strFrame}${strClass}`;
	}
}
