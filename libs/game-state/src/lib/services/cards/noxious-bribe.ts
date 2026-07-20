/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Noxious Bribe (JAIL_861)
 * Discover a Choose One card. It has both effects combined. Give your opponent a plain copy.
 */
import { CardIds, GameTag, hasMechanic } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import {
	GeneratingCard,
	GuessCardIdInput,
	GuessInfoInput,
	StaticGeneratingCard,
	StaticGeneratingCardInput,
} from './_card.type';
import { filterCards } from './utils';

const chooseOneFilter = (c: Parameters<typeof hasCorrectType>[0], currentClass: string | undefined) =>
	hasMechanic(c, GameTag.CHOOSE_ONE) && canBeDiscoveredByClass(c, currentClass);

export const NoxiousBribe: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.NoxiousBribe_JAIL_861],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) =>
		filterCards(
			CardIds.NoxiousBribe_JAIL_861,
			input.allCards,
			(c) => chooseOneFilter(c, input.inputOptions.deckState.getCurrentClass()),
			input.inputOptions,
		),
	guessCardId: (input: GuessCardIdInput) => {
		console.debug('[debug] guessing card id for Noxious Bribe', input);
		const inHand = input.opponentDeckState.hand.find((c) => c.creatorEntityId === input.creatorEntityId);
		if (!inHand) {
			console.warn(
				'Could not find card created by Noxious Bribe in player hand',
				input.opponentDeckState.hand.map((c) => c.cardId),
			);
			return null;
		}

		return inHand.cardId;
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => ({
		mechanics: [GameTag.CHOOSE_ONE],
		possibleCards: filterCards(
			CardIds.NoxiousBribe_JAIL_861,
			input.allCards,
			(c) => chooseOneFilter(c, input.deckState.getCurrentClass()),
			input.options,
		),
	}),
};
