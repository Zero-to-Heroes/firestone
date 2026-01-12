/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput } from './_card.type';

// Timeline Witness (TOT_111)
// "Instead of drawing your normal card each turn, <b>Discover</b> a card from your deck."
export const TimelineWitness: GeneratingCard = {
	cardIds: [CardIds.TimelineWitness],
	publicTutor: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const possibleCards = input.deckState.deck?.map((c) => c.cardId).filter((c) => !!c) ?? [];
		return {
			possibleCards: possibleCards,
			canBeDiscoveredBy: TimelineWitness.cardIds[0],
		};
	},
};
