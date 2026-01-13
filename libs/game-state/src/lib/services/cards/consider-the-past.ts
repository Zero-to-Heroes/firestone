/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, CardType, GameFormat, GameType, isValidSet, SetId } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

// Consider the Past (TOT_341)
// "Add 3 random spells from the past to your hand."
// "from the past" = usable in Wild but not in Standard
export const ConsiderThePast: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.ConsiderThePast],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			ConsiderThePast.cardIds[0],
			input.allCards,
			(c) =>
				hasCorrectType(c, CardType.SPELL) &&
				!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
				isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_WILD, GameType.GT_RANKED),
			{ ...input.inputOptions, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.SPELL,
			possibleCards: filterCards(
				ConsiderThePast.cardIds[0],
				input.allCards,
				(c) =>
					hasCorrectType(c, CardType.SPELL) &&
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
					isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_WILD, GameType.GT_RANKED),
				{ ...input.options, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
			),
		};
	},
};
