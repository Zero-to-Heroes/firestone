import * as Cards from './_barrel';
import { Card } from './_card.type';

const cards: Card[] = Object.values(Cards).filter((c) => c && typeof c === 'object' && 'cardIds' in c);

const internalCache: { [cardId: string]: Card } = {};
for (const card of cards) {
	const cardIds = card.cardIds ?? [];
	for (const cardId of cardIds) {
		internalCache[cardId] = card;
	}
}
export const cardsInfoCache: { [cardId: string]: Card } = internalCache;
