import * as Cards from './_barrel';
import { Card, GeneratingCard, SpecialCaseParserCard, StaticGeneratingCard } from './_card.type';

const cards: (GeneratingCard | SpecialCaseParserCard | StaticGeneratingCard)[] = Object.values(Cards).filter(
	(c) => c && typeof c === 'object' && 'cardIds' in c,
);

const internalCache: { [cardId: string]: GeneratingCard | SpecialCaseParserCard | StaticGeneratingCard } = {};
for (const card of cards) {
	const cardIds = card.cardIds ?? [];
	for (const cardId of cardIds) {
		internalCache[cardId] = card;
	}
}
export const cardsInfoCache: { [cardId: string]: GeneratingCard | SpecialCaseParserCard | StaticGeneratingCard } =
	internalCache;
