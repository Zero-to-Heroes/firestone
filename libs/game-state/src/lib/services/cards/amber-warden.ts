/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameFormat, GameType, isValidSet, SetId } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../..';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const AmberWarden: StaticGeneratingCard = {
	cardIds: [CardIds.AmberWarden_TIME_052],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const possibleCards = filterCards(
			AmberWarden.cardIds[0],
			input.allCards,
			(c) =>
				// "from the past" = usable in Wild but not in Standard
				!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
				hasCorrectType(c, CardType.MINION),
			// Use Wild format to get the full pool of cards
			{ ...input.inputOptions, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
		);
		return possibleCards;
	},
};
