/* eslint-disable no-mixed-spaces-and-tabs */
// Psychic Conjurer (CORE_EX1_193 / EX1_193): 1 Mana 1/2 Priest Undead Minion
// "Battlecry: Copy a card in your opponent's deck and add it to your hand."

import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const PsychicConjurer: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.PsychicConjurerCore, CardIds.PsychicConjurerLegacy],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return input.inputOptions.opponentDeckState.deck.map((c) => c.cardId).filter((c) => !!c);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = input.opponentDeckState.deck.map((c) => c.cardId).filter((c) => !!c);
		return {
			possibleCards: possibleCards,
		};
	},
};
