import { ReferenceCard } from '../../../../../models/reference-cards/reference-card';
import { AllCardsService } from '../../../../all-cards.service';

export function buildCardArraysFromDeck(deck: any, cards: AllCardsService): readonly ReferenceCard[] {
	return deck.cards.map(pair => fillArray(cards.getCardFromDbfId(pair[0]), pair[1])).reduce((a, b) => a.concat(b));
}

function fillArray(value, len) {
	var arr = [];
	for (var i = 0; i < len; i++) {
		arr.push(value);
	}
	return arr;
}
