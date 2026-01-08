/* eslint-disable no-mixed-spaces-and-tabs */
import {
	CardIds,
	CardType,
	GameFormat,
	GameType,
	hasCorrectTribe,
	isValidSet,
	Race,
	SetId,
} from '@firestone-hs/reference-data';
import { TempCardIds } from '@firestone/shared/common/service';
import { canBeDiscoveredByClass, GuessedInfo, hasCorrectType } from '../../..';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const WingsOfEternity: GeneratingCard & StaticGeneratingCard = {
	cardIds: [TempCardIds.WingsOfEternity as unknown as CardIds],
	publicCreator: true,
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			races: [Race.DRAGON],
			possibleCards: filterCards(
				WingsOfEternity.cardIds[0],
				input.allCards,
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
					hasCorrectTribe(c, Race.DRAGON) &&
					hasCorrectType(c, CardType.MINION) &&
					canBeDiscoveredByClass(c, input.deckState.getCurrentClass()),
				{ ...input.options, format: GameFormat.FT_STANDARD, gameType: GameType.GT_RANKED },
			),
		};
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const possibleCards = filterCards(
			WingsOfEternity.cardIds[0],
			input.allCards,
			(c) =>
				// "from the past" = usable in Wild but not in Standard
				!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
				hasCorrectTribe(c, Race.DRAGON) &&
				hasCorrectType(c, CardType.MINION) &&
				canBeDiscoveredByClass(c, input.inputOptions.deckState.getCurrentClass()),
			// Use Wild format to get the full pool of cards
			{ ...input.inputOptions, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
		);
		return possibleCards;
	},
};
