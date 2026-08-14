/* eslint-disable no-mixed-spaces-and-tabs */
// Stadium Announcer (TIME_034): 4 Mana 3/3 DRAGON
// "[x]<b>Rewind</b> <b>Battlecry:</b> Both players equip a random weapon. Give yours +1/+1."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.WEAPON);

export const StadiumAnnouncer: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.StadiumAnnouncer_TIME_034],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(StadiumAnnouncer.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(StadiumAnnouncer.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.WEAPON, possibleCards };
	},
};
