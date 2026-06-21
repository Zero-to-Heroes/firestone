import { Card } from './_card.type';
import { cardsMapping } from './global/_registers';

let cardsInfoCache: Record<string, Card> | null = null;

function getCardsInfoCache(): Record<string, Card> {
	if (!cardsInfoCache) {
		// Lazy load avoids circular dependency: cards-highlight-common -> _mapping -> _barrel -> card modules
		cardsInfoCache = require('./_mapping').cardsInfoCache as Record<string, Card>;
	}
	return cardsInfoCache;
}

export function getCardImpl(cardId: string): Card | undefined {
	return cardsMapping[cardId] ?? getCardsInfoCache()[cardId];
}
