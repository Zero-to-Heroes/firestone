/* eslint-disable no-mixed-spaces-and-tabs */
// Observer of Mysteries (TOY_520): 3 Mana 2/2 DEMON
// "<b>Battlecry:</b> Cast 2 random <b>Secrets</b>. At the start of your turn, destroy them."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL) && hasMechanic(c, GameTag.SECRET);

export const ObserverOfMysteries: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ObserverOfMysteries_TOY_520],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(ObserverOfMysteries.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(ObserverOfMysteries.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, mechanics: [GameTag.SECRET], possibleCards };
	},
};
