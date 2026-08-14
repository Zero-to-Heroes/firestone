/* eslint-disable no-mixed-spaces-and-tabs */
// Menacing Nimbus (BOT_533 / CORE_BOT_533): 2 Mana 2/3 ELEMENTAL
// "<b>Battlecry:</b> Add a random Elemental to your hand."

import { CardIds, CardType, Race, hasCorrectTribe, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.ELEMENTAL);

export const MenacingNimbus: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.MenacingNimbus, CardIds.MenacingNimbusCore],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(MenacingNimbus.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(MenacingNimbus.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, races: [Race.ELEMENTAL], possibleCards };
	},
};
