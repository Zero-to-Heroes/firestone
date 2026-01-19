// Titanforged Traps (TTN_302)
// Hunter Spell - Discover a Secret to cast.
import { CardClass, CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { canBeDiscoveredByClass, hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const TitanforgedTraps: StaticGeneratingCard = {
	cardIds: [CardIds.TitanforgedTraps],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.getCurrentClass();
		return filterCards(
			TitanforgedTraps.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasMechanic(c, GameTag.SECRET) &&
				hasCorrectClass(c, CardClass.HUNTER) &&
				canBeDiscoveredByClass(c, currentClass),
			input.inputOptions,
		);
	},
};
