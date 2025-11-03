import { CardIds } from '@firestone-hs/reference-data';
import { GeneratingCard } from './cards/_card.type';
import { cardsInfoCache } from './cards/_mapping';

export const cardsWithCreationSequenceInfo: CardIds[] = [];
setTimeout(() => {
	for (const cardId of Object.keys(cardsInfoCache)) {
		const card = cardsInfoCache[cardId];
		if ((card as GeneratingCard).hasSequenceInfo && !cardsWithCreationSequenceInfo.includes(cardId as CardIds)) {
			cardsWithCreationSequenceInfo.push(cardId as CardIds);
		}
	}
}, 500);
