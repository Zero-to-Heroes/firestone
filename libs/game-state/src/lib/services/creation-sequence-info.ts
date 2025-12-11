import { CardIds } from '@firestone-hs/reference-data';
import { hasGeneratingCard } from './cards/_card.type';
import { cardsInfoCache } from './cards/_mapping';

const internalCardsWithCreationSequenceInfo: CardIds[] = [];
for (const cardId of Object.keys(cardsInfoCache)) {
	const cardImpl = cardsInfoCache[cardId];
	if (hasGeneratingCard(cardImpl)) {
		if (cardImpl.hasSequenceInfo && !internalCardsWithCreationSequenceInfo.includes(cardId as CardIds)) {
			internalCardsWithCreationSequenceInfo.push(cardId as CardIds);
		}
	}
}
export const cardsWithCreationSequenceInfo: CardIds[] = internalCardsWithCreationSequenceInfo;
