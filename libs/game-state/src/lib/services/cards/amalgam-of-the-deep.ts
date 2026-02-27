/* eslint-disable no-mixed-spaces-and-tabs */
// Amalgam of the Deep (TSC_069): 2 Mana 2/3 Neutral ALL minion
// "Battlecry: Choose a friendly minion. Discover a minion of the same minion type."
// The discover pool depends on the targeted friendly minion's race(s).
// If the target has ALL races (e.g. another Amalgam), the pool includes all minions with at least one tribe.

import { CardIds, CardType, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput } from './_card.type';
import { filterCards } from './utils';

export const AmalgamOfTheDeep: GeneratingCard = {
	cardIds: [CardIds.AmalgamOfTheDeep],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const creatorEntityId = input.card.creatorEntityId;
		const amalgamCard =
			input.deckState.findCard(creatorEntityId)?.card ??
			input.opponentDeckState.findCard(creatorEntityId)?.card;
		const targetCardId = amalgamCard?.storedInformation?.targetCardId;
		if (!targetCardId) {
			return null;
		}

		const targetRefCard = input.allCards.getCard(targetCardId);
		if (!targetRefCard) {
			return null;
		}

		const targetRaces: Race[] =
			targetRefCard.races?.map((r) => Race[r as keyof typeof Race]).filter((r): r is Race => r != null) ?? [];
		if (!targetRaces.length) {
			return null;
		}

		const currentClass = input.deckState.getCurrentClass();
		return {
			cardType: CardType.MINION,
			races: targetRaces,
			possibleCards: filterCards(
				AmalgamOfTheDeep.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.MINION) &&
					targetRaces.some((race) => hasCorrectTribe(c, race)) &&
					canBeDiscoveredByClass(c, currentClass),
				input.options,
			),
		};
	},
};
