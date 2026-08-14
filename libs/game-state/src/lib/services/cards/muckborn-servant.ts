/* eslint-disable no-mixed-spaces-and-tabs */
// Muckborn Servant (REV_947 / CORE_REV_947): 3 Mana 2/4
// "<b>Taunt</b> <b>Battlecry:</b> <b>Discover</b> a Paladin card."

import { CardIds, CardClass, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectClass(c, CardClass.PALADIN);

export const MuckbornServant: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.MuckbornServant, CardIds.MuckbornServant_CORE_REV_947],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(MuckbornServant.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(MuckbornServant.cardIds[0], input.allCards, isMatch, input.options);
		return { cardClasses: [CardClass.PALADIN], possibleCards };
	},
};
