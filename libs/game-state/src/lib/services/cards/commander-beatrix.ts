/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Commander Beatrix (JAIL_397)
 * Taunt. While building your deck, pick a 2-Cost minion. Ten copies join your deck!
 */
import { CardIds } from '@firestone-hs/reference-data';
import { and, effectiveCostLess, inDeck, minion, side } from '../card-highlight/selectors';

import { GeneratingCard, GuessCardIdInput, SelectorCard } from './_card.type';

export const CommanderBeatrix: SelectorCard & GeneratingCard = {
	cardIds: [CardIds.CommanderBeatrix_JAIL_397],
	selector: (inputSide) => and(side(inputSide), inDeck, minion, effectiveCostLess(3)),
	guessCardId: (input: GuessCardIdInput) => {
		const result =
			input.deckState.sideboards?.find((s) => s.keyCardId === CardIds.CommanderBeatrix_JAIL_397)?.cards?.[0] ??
			null;
		return result;
	},
};
