/* eslint-disable no-mixed-spaces-and-tabs */
// Reliquary Researcher (WW_432): 4 Mana 3/5
// "[x]<b>Battlecry:</b> If you've <b>Excavated</b> twice, cast two random Mage <b>Secrets</b>."

import { CardIds, CardType, CardClass, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType, hasCorrectClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.SPELL) && hasMechanic(c, GameTag.SECRET) && hasCorrectClass(c, CardClass.MAGE);

export const ReliquaryResearcher: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ReliquaryResearcher_WW_432],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(ReliquaryResearcher.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(ReliquaryResearcher.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.SPELL, mechanics: [GameTag.SECRET], cardClasses: [CardClass.MAGE], possibleCards };
	},
};
