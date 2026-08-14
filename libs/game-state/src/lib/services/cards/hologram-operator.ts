/* eslint-disable no-mixed-spaces-and-tabs */
// Hologram Operator (GDB_723): 2 Mana 3/2 DRAENEI
// "<b>Battlecry:</b> Get 3 random <b>Temporary</b> Draenei."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.DRAENEI);

export const HologramOperator: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.HologramOperator_GDB_723],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(HologramOperator.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(HologramOperator.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.DRAENEI], possibleCards };
	},
};
