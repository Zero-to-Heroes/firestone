/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Reno Lone Ranger hero power - Nature Bullet: Discovers a spell from the current player's class
export const RenoLoneRangerNatureBullet: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RenoLoneRanger_NatureBullet_WW_0700p5],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const currentClass = input.inputOptions.deckState.getCurrentClass();
		return filterCards(
			RenoLoneRangerNatureBullet.cardIds[0],
			input.allCards,
			(c) => c.type?.toUpperCase() === CardType[CardType.SPELL] && canBeDiscoveredByClass(c, currentClass),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		const currentClass = input.deckState.getCurrentClass();
		return {
			cardType: CardType.SPELL,
			cardClasses: currentClass ? [CardClass[currentClass]] : undefined,
			possibleCards: filterCards(
				RenoLoneRangerNatureBullet.cardIds[0],
				input.allCards,
				(c) => c.type?.toUpperCase() === CardType[CardType.SPELL] && canBeDiscoveredByClass(c, currentClass),
				input.options,
			),
		};
	},
};
