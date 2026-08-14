/* eslint-disable no-mixed-spaces-and-tabs */
// Mystery Dispense-o-bot (JAM_000t4): 3 Mana 3/3 MECH
// "[x]<b>Battlecry:</b> Get two random Mage <b>Secrets</b>. <i>(Changes each turn.)</i>"

import { CardIds, CardClass, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) => hasMechanic(c, GameTag.SECRET) && hasCorrectClass(c, CardClass.MAGE);

export const MysteryDispenseOBot: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RemixedDispenseOBot_MysteryDispenseOBotToken],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(MysteryDispenseOBot.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(MysteryDispenseOBot.cardIds[0], input.allCards, isMatch, input.options);
		return { mechanics: [GameTag.SECRET], cardClasses: [CardClass.MAGE], possibleCards };
	},
};
