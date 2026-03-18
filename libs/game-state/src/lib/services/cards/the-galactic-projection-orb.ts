/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * The Galactic Projection Orb (TOY_378) - Mage Spell (10 mana)
 * Recast a random spell of each Cost you've cast this game (targets enemies if possible).
 */
import { CardIds } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const TheGalacticProjectionOrb: StaticGeneratingCard = {
	cardIds: [CardIds.TheGalacticProjectionOrb_TOY_378],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const spellsPlayedThisMatch = input.inputOptions.deckState?.spellsPlayedThisMatch ?? [];
		const uniqueSpellIds = new Set<string>();
		return [...spellsPlayedThisMatch]
			.filter((spell) => !!spell?.cardId)
			.sort((a, b) => (a.refManaCost ?? 0) - (b.refManaCost ?? 0))
			.map((spell) => spell.cardId)
			.filter((cardId) => {
				if (uniqueSpellIds.has(cardId)) {
					return false;
				}
				uniqueSpellIds.add(cardId);
				return true;
			});
	},
};
