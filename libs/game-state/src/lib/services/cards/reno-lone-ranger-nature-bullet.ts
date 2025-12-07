/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// TODO: Verify card mechanics - assuming this discovers a Druid spell based on the "Nature Bullet" name
export const RenoLoneRangerNatureBullet: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RenoLoneRanger_NatureBullet_WW_0700p5],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			RenoLoneRangerNatureBullet.cardIds[0],
			input.allCards,
			(c) => c.type?.toUpperCase() === CardType[CardType.SPELL] && canBeDiscoveredByClass(c, CardClass[CardClass.DRUID]),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			cardClasses: [CardClass[CardClass.DRUID]],
			possibleCards: filterCards(
				RenoLoneRangerNatureBullet.cardIds[0],
				input.allCards,
				(c) => c.type?.toUpperCase() === CardType[CardType.SPELL] && canBeDiscoveredByClass(c, CardClass[CardClass.DRUID]),
				input.options,
			),
		};
	},
};
