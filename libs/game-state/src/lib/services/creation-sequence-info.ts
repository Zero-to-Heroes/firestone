import { CardIds } from '@firestone-hs/reference-data';
import { GeneratingCard } from './cards/_card.type';
import { cardsInfoCache } from './cards/_mapping';

const internalCardsWithCreationSequenceInfo: CardIds[] = [];
for (const cardId of Object.keys(cardsInfoCache)) {
	const card = cardsInfoCache[cardId];
	if (
		(card as GeneratingCard).hasSequenceInfo &&
		!internalCardsWithCreationSequenceInfo.includes(cardId as CardIds)
	) {
		internalCardsWithCreationSequenceInfo.push(cardId as CardIds);
	}
}
export const cardsWithCreationSequenceInfo: CardIds[] = internalCardsWithCreationSequenceInfo;
