/* eslint-disable no-mixed-spaces-and-tabs */
import { CardClass, CardIds, CardType } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Hagatha the Witch hero power (Heroic version) - Adds a random Shaman spell to your hand
export const HagathaTheWitchBewitchHeroic: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.HagathaTheWitch_BewitchHeroic],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			HagathaTheWitchBewitchHeroic.cardIds[0],
			input.allCards,
			(c) => c.type?.toUpperCase() === CardType[CardType.SPELL] && canBeDiscoveredByClass(c, CardClass[CardClass.SHAMAN]),
			input.inputOptions,
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			cardClasses: [CardClass[CardClass.SHAMAN]],
			possibleCards: filterCards(
				HagathaTheWitchBewitchHeroic.cardIds[0],
				input.allCards,
				(c) => c.type?.toUpperCase() === CardType[CardType.SPELL] && canBeDiscoveredByClass(c, CardClass[CardClass.SHAMAN]),
				input.options,
			),
		};
	},
};
