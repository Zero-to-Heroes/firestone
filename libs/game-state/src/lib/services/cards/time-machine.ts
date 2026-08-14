/* eslint-disable no-mixed-spaces-and-tabs */
// Time Machine (TIME_035): 6 Mana 6/6 MECH
// "<b>Taunt</b> <b>Deathrattle:</b> Get a random <b>Rewind</b> card."

import { CardIds, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';

import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasMechanic(c, GameTag.REWIND);

export const TimeMachine: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.TimeMachine_TIME_035],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(TimeMachine.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(TimeMachine.cardIds[0], input.allCards, isMatch, input.options);
		return { mechanics: [GameTag.REWIND], possibleCards };
	},
};
