/* eslint-disable no-mixed-spaces-and-tabs */
// Howdyfin (WW_333): 2 Mana 2/3 MURLOC
// "[x]Whenever your hand has less than 3 cards in it, get a random Murloc."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MURLOC);

export const Howdyfin: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Howdyfin_WW_333],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Howdyfin.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(Howdyfin.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.MURLOC], possibleCards };
	},
};
