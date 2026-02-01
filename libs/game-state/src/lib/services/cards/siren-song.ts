/* eslint-disable no-mixed-spaces-and-tabs */
// Siren Song: Get two random spells from spell schools you haven't cast this game.
import { CardIds, CardType } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const SirenSong: StaticGeneratingCard = {
	cardIds: [CardIds.SirenSong_VAC_308],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Get all spell schools played this match by the player
		const playedSpellSchools = input.inputOptions.deckState.uniqueSpellSchools;
		const playedSpellSchoolsSet = new Set(playedSpellSchools);

		// Filter for spells that have a spell school not yet played
		// No class filter - random spells can come from any class
		return filterCards(
			SirenSong.cardIds[0],
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
				return hasUnplayedSpellSchool;
			},
			input.inputOptions,
		);
	},
};
