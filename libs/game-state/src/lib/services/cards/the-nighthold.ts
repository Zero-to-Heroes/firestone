/* eslint-disable no-mixed-spaces-and-tabs */
// The Nighthold: Cast a random secret from your class
// According to game behavior, it casts from the full pool of all Paladin secrets,
// not constrained by the current game mode (e.g., arena rotation)
import { CardClass, CardIds, CardType, GameTag, hasMechanic } from '@firestone-hs/reference-data';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const TheNighthold: StaticGeneratingCard = {
	cardIds: [CardIds.RuniTimeExplorer_TheNightholdToken_WON_053t4],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			TheNighthold.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasMechanic(c, GameTag.SECRET) &&
				hasCorrectClass(c, CardClass.PALADIN),
			input.inputOptions,
		);
	},
};
