/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Razzle-Dazzler - 6 Mana 6/6: Battlecry: Add 3 random spells (one of each Spell School) to your hand.
export const RazzleDazzler: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RazzleDazzler_VAC_301],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Get all spell schools played this match by the player
		const playedSpellSchools = input.inputOptions.deckState.uniqueSpellSchools;
		const playedSpellSchoolsSet = new Set(playedSpellSchools);

		// Filter for spells that have a spell school not yet played
		return filterCards(
			RazzleDazzler.cardIds[0],
			input.allCards,
			(c) => {
				// Must be a spell
				if (c.type?.toUpperCase() !== CardType[CardType.SPELL]) {
					return false;
				}

				// Must have a spell school
				if (!c.spellSchool) {
					return false;
				}

				// Check if this spell has a spell school not yet played
				const hasUnplayedSpellSchool = !playedSpellSchoolsSet.has(c.spellSchool);
				// Must be discoverable by class
				return hasUnplayedSpellSchool && canBeDiscoveredByClass(c, input.inputOptions.currentClass);
			},
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		// Get all spell schools played this match by the player
		const playedSpellSchools = input.deckState.uniqueSpellSchools;
		const playedSpellSchoolsSet = new Set(playedSpellSchools);

		return {
			cardType: CardType.SPELL,
			possibleCards: filterCards(
				RazzleDazzler.cardIds[0],
				input.allCards,
				(c) => {
					// Must be a spell
					if (c.type?.toUpperCase() !== CardType[CardType.SPELL]) {
						return false;
					}

					// Must have a spell school
					if (!c.spellSchool) {
						return false;
					}

					// Check if this spell has a spell school not yet played
					const hasUnplayedSpellSchool = !playedSpellSchoolsSet.has(c.spellSchool);
					// Must be discoverable by class
					return hasUnplayedSpellSchool && canBeDiscoveredByClass(c, input.deckState.getCurrentClass());
				},
				input.options,
			),
		};
	},
};
