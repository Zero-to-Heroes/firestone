import { AllCardsService, ReferenceCard } from '@firestone-hs/replay-parser';

export function buildCardArraysFromDeck(deck: any, cards: AllCardsService): readonly ReferenceCard[] {
	return deck.cards
		.map(pair => fillArray(cards.getCardFromDbfId(pair[0]), pair[1]))
		.reduce((a, b) => a.concat(b))
		.filter(card => card);
}

function fillArray(value, len) {
	const arr = [];
	for (let i = 0; i < len; i++) {
		arr.push(value);
	}
	return arr;
}
