/* eslint-disable no-mixed-spaces-and-tabs */
// Timelooper Toki (TIME_861): 3 Mana 3/3
// "[x]<b>Battlecry:</b> Get 3 random spells from the past. When you play ALL 3, get another Timelooper Toki."

import { CardIds, CardType, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCardsFromThePast } from './utils';

const isMatch = (c: ReferenceCard) => hasCorrectType(c, CardType.SPELL);

export const TimelooperToki: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TimelooperToki_TIME_861],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCardsFromThePast(TimelooperToki.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCardsFromThePast(TimelooperToki.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, possibleCards };
	},
};
