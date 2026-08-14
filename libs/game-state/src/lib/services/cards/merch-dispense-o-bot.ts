/* eslint-disable no-mixed-spaces-and-tabs */
// Merch Dispense-o-bot (JAM_000t2): 3 Mana 3/3 MECH
// "[x]<b>Battlecry:</b> Get two random Mechs. <i>(Changes each turn.)</i>"

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MECH);

export const MerchDispenseOBot: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RemixedDispenseOBot_MerchDispenseOBotToken],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(MerchDispenseOBot.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(MerchDispenseOBot.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.MECH], possibleCards };
	},
};
