/* eslint-disable no-mixed-spaces-and-tabs */
// The Nighthold: Cast a random secret from your class
// According to game behavior, it casts from the full pool of all Paladin secrets,
// not constrained by the current game mode (e.g., arena rotation)
import { CardClass, CardIds, CardType, GameFormat, GameTag, GameType, hasMechanic } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectClass, hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const TheNighthold: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.RuniTimeExplorer_TheNightholdToken_WON_053t4],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			mechanics: [GameTag.SECRET],
			cardClasses: [CardClass.PALADIN],
			possibleCards: filterCards(
				TheNighthold.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.SPELL) &&
					hasMechanic(c, GameTag.SECRET) &&
					hasCorrectClass(c, CardClass.PALADIN),
				// Use Wild format to get all Paladin secrets, not constrained by game mode
				{ ...input.options, metadata: { ...input.options?.metadata, formatType: GameFormat.FT_WILD, gameType: GameType.GT_RANKED } },
			),
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		// Use Wild format to get all Paladin secrets, not constrained by game mode
		return filterCards(
			TheNighthold.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				hasMechanic(c, GameTag.SECRET) &&
				hasCorrectClass(c, CardClass.PALADIN),
			{ ...input.inputOptions, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
		);
	},
};
