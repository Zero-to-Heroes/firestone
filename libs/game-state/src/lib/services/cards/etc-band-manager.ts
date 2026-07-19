/* eslint-disable no-mixed-spaces-and-tabs */
/**
 * Commander Beatrix (JAIL_397)
 * Taunt. While building your deck, pick a 2-Cost minion. Ten copies join your deck!
 */
import { CardIds, isArena } from '@firestone-hs/reference-data';
import { GuessedInfo } from '../../models/deck-card';
import { GeneratingCard, GuessInfoInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const EtcBandManager: StaticGeneratingCard & GeneratingCard = {
	cardIds: [CardIds.ETCBandManager_ETC_080],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		if (isArena(input.inputOptions.gameState.metadata.gameType)) {
			return [CardIds.Kiljaeden_GDB_145, CardIds.TheCeaselessExpanse_GDB_142, CardIds.RenoJackson_CORE_LOE_011];
		}
		return (
			input.inputOptions.deckState.sideboards?.find((s) => s.keyCardId === CardIds.ETCBandManager_ETC_080)
				?.cards ?? []
		);
	},
	guessInfo: (input: GuessInfoInput): GuessedInfo | null => {
		if (isArena(input.gameState.metadata.gameType)) {
			const possibleCards = [
				CardIds.Kiljaeden_GDB_145,
				CardIds.TheCeaselessExpanse_GDB_142,
				CardIds.RenoJackson_CORE_LOE_011,
			];
			return {
				possibleCards: possibleCards,
			};
		}
		return null;
	},
};
