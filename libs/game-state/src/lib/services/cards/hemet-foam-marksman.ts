/* eslint-disable no-mixed-spaces-and-tabs */
import {
	AllCardsService,
	CardIds,
	CardRarity,
	CardType,
	GameFormat,
	GameType,
	hasCorrectTribe,
	isValidSet,
	Race,
	SetId,
} from '@firestone-hs/reference-data';
import { filterCards, hasCorrectRarity, hasCorrectType } from '../../related-cards/dynamic-pools';
import { DeckCard, GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards as filterCardsUtils } from './utils';

export const HemetFoamMarksman: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.HemetFoamMarksman_TOY_355],
	hasSequenceInfo: true,
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		return filterCards(
			input.allCards,
			// So that we don't get cards from the arena-specific pool instead
			{ ...input.inputOptions, format: GameFormat.FT_WILD, gameType: GameType.GT_RANKED },
			HemetFoamMarksman.cardIds[0],
			(c) =>
				!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.BEAST) &&
				hasCorrectRarity(c, CardRarity.LEGENDARY),
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		return {
			cardType: CardType.MINION,
			races: [Race.BEAST],
			rarity: CardRarity.LEGENDARY,
			possibleCards: filterCards(
				input.allCards,
				{
					format: GameFormat.FT_WILD,
					gameType: GameType.GT_RANKED,
					scenarioId: input.options?.metadata?.scenarioId ?? 0,
					validArenaPool: input.options?.validArenaPool ?? [],
				},
				HemetFoamMarksman.cardIds[0],
				(c) =>
					!isValidSet(c.set.toLowerCase() as SetId, GameFormat.FT_STANDARD, GameType.GT_RANKED) &&
					hasCorrectType(c, CardType.MINION) &&
					hasCorrectTribe(c, Race.BEAST) &&
					hasCorrectRarity(c, CardRarity.LEGENDARY),
			),
		};
	},
};
