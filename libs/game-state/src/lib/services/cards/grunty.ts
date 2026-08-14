/* eslint-disable no-mixed-spaces-and-tabs */
// Grunty (SC_013): 8 Mana 3/4 MURLOC
// "[x]<b>Battlecry:</b> Summon four random Murlocs, then shoot them at enemy minions. <i>(You pick the targets!)</i>"

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.MURLOC);

export const Grunty: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.Grunty_SC_013],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(Grunty.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(Grunty.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.MURLOC], possibleCards };
	},
};
