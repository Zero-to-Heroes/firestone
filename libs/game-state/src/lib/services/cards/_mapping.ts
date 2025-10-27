import * as Cards from './_barrel';
import { Card, GeneratingCard } from './_card.type';

const cards: GeneratingCard[] = Object.values(Cards).filter((c) => c && typeof c === 'object' && 'cardIds' in c);

export const cardsInfoCache: { [cardId: string]: GeneratingCard } = {};
for (const card of cards) {
	const cardIds = card.cardIds ?? [];
	for (const cardId of cardIds) {
		cardsInfoCache[cardId] = card;
	}
}
