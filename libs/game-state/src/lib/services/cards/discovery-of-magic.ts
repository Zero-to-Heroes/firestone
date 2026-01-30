/* eslint-disable no-mixed-spaces-and-tabs */
// Discovery of Magic: Discover a spell from a spell school you haven't cast this game (from any class).
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const DiscoveryOfMagic: StaticGeneratingCard = {
	cardIds: [CardIds.DiscoveryOfMagic],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Get all spell schools played this match by the player
		const playedSpellSchools = input.inputOptions.deckState.uniqueSpellSchools;
		const playedSpellSchoolsSet = new Set(playedSpellSchools);

		// Filter for spells that have a spell school not yet played
		// Discovery of Magic can discover from any class (as per card text)
		return filterCards(
			DiscoveryOfMagic.cardIds[0],
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
				// For spells with multiple spell schools, include if ANY school hasn't been played
				const hasUnplayedSpellSchool = !playedSpellSchoolsSet.has(c.spellSchool);
				// No class filter - card explicitly says "from any class"
				return hasUnplayedSpellSchool;
			},
			input.inputOptions,
		);
	},
};
