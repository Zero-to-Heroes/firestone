/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
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
		// Discovery of Magic can discover from any class
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
				
				// Must be discoverable (can be from any class according to card text)
				return hasUnplayedSpellSchool && canBeDiscoveredByClass(c, input.inputOptions.currentClass);
			},
			input.inputOptions,
		);
	},
};
