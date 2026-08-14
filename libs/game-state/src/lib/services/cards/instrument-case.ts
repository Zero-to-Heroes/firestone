/* eslint-disable no-mixed-spaces-and-tabs */
// Instrument Case (ETC_098t): 2 Mana 0/3
// "<b>Deathrattle:</b> Add a random weapon to your opponent's hand."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.WEAPON);

export const InstrumentCase: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.WorgenRoadie_InstrumentCaseToken],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(InstrumentCase.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(InstrumentCase.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.WEAPON, possibleCards };
	},
};
