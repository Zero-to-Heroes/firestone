/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * King of the Underbelly (JAIL_831)
 * While building your deck, pick 3 contraband Beasts. Battlecry: Discover one. It costs (3) less.
 */
import { CardIds, CardType, isArena, Race } from '@firestone-hs/reference-data';

import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

const ARENA_BEASTS = [CardIds.Ursol_EDR_259, CardIds.TheGreatDracorex_DINO_401, CardIds.Tortolla_EDR_471];

export const KingoftheUnderbelly: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.KingoftheUnderbelly_JAIL_831],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		if (isArena(input.inputOptions.gameState.metadata.gameType)) {
			return ARENA_BEASTS;
		}
		return (
			input.inputOptions.deckState.sideboards?.find((s) => s.keyCardId === CardIds.KingoftheUnderbelly_JAIL_831)
				?.cards ?? []
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (isArena(input.gameState.metadata.gameType)) {
			return {
				cardType: CardType.MINION,
				races: [Race.BEAST],
				possibleCards: ARENA_BEASTS,
			};
		}
		const possibleCards =
			input.deckState.sideboards?.find((s) => s.keyCardId === CardIds.KingoftheUnderbelly_JAIL_831)?.cards ?? [];
		return {
			cardType: CardType.MINION,
			races: [Race.BEAST],
			...(possibleCards.length ? { possibleCards } : {}),
		};
	},
};
