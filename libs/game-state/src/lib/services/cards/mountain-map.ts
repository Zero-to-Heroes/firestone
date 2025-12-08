/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, Race } from '@firestone-hs/reference-data';
import { extractUniqueTribes } from '../../counters/impl/menagerie';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const MountainMap: StaticGeneratingCard = {
	cardIds: [CardIds.MountainMap_TLC_464],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Get all minions played this match by the player
		const allPlayedCards = input.inputOptions.deckState.cardsPlayedThisMatch;
		const playedMinions = allPlayedCards
			.map((c) => input.allCards.getCard(c.cardId))
			.filter((c) => c?.type?.toUpperCase() === CardType[CardType.MINION]);

		// Extract all tribes that have been played
		// extractUniqueTribes returns Race[] enum values
		const playedTribes = extractUniqueTribes(playedMinions);
		// Convert to a Set of string tribe names for comparison with card.races
		const playedTribesSet = new Set(playedTribes.map((tribe) => Race[tribe]));

		// Filter for minions that have at least one tribe not yet played
		return filterCards(
			MountainMap.cardIds[0],
			input.allCards,
			(c) => {
				// Must be a minion
				if (c.type?.toUpperCase() !== CardType[CardType.MINION]) {
					return false;
				}

				// Must have at least one race/tribe
				if (!c.races || c.races.length === 0) {
					return false;
				}

				// Check if this minion has at least one unplayed tribe
				// "ALL" tribe minions (Amalgam) count as all tribes, so include them
				// if any tribe hasn't been played yet
				if (c.races.includes('ALL')) {
					return canBeDiscoveredByClass(c, input.inputOptions.currentClass);
				}

				// For regular minions, check if they have at least one unplayed tribe
				const hasUnplayedTribe = c.races.some((race) => !playedTribesSet.has(race));
				return hasUnplayedTribe && canBeDiscoveredByClass(c, input.inputOptions.currentClass);
			},
			input.inputOptions,
		);
	},
};
