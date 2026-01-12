/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

// Timeline Witness (TOT_111)
// "Instead of drawing your normal card each turn, <b>Discover</b> a card from your deck."
// Note: This card discovers from the player's own deck, not from a random pool,
// so we don't need guessInfo. The dynamicPool returns empty since the options
// come from the player's deck which is already known.
export const TimelineWitness: StaticGeneratingCard = {
	cardIds: [CardIds.TimelineWitness],
	publicCreator: false,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Returns empty - the card discovers from the player's deck, not a random pool
		return [];
	},
};
