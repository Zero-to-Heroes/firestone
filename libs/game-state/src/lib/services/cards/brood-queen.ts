/* eslint-disable no-mixed-spaces-and-tabs */
// Hive Queen (SC_003 / SC_003t): 3 Mana 2/5
// "[x]At the end of your turn, get a Larva that transforms into random Zerg minions."

import { CardIds, CardType, GameTag, hasMechanic, ReferenceCard } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

const isMatch = (c: ReferenceCard) =>
	hasCorrectType(c, CardType.MINION) && hasMechanic(c, GameTag.ZERG) && c?.id !== CardIds.BroodQueen_SC_003;

export const BroodQueen: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.BroodQueen_SC_003, CardIds.BroodQueen_LarvaToken_SC_003t],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(BroodQueen.cardIds[0], input.allCards, isMatch, input.inputOptions),
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = filterCards(BroodQueen.cardIds[0], input.allCards, isMatch, input.options);
		return { cardType: CardType.MINION, mechanics: [GameTag.ZERG], possibleCards };
	},
};
