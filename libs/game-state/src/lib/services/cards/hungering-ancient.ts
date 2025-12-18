/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { GeneratingCard, GuessCardIdInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const HungeringAncient: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.HungeringAncient_EDR_494],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput): readonly string[] => {
		const deckState = input.inputOptions.deckState.isOpponent
			? input.inputOptions.gameState.fullGameState!.Opponent
			: input.inputOptions.gameState.fullGameState!.Player;
		// Doing it this way so that it also works on dead entities
		const enchantments = deckState.AllEntities.filter(
			(e) =>
				e.cardId === CardIds.HungeringAncient_FeedMeEnchantment_EDR_494e &&
				e.tags?.find((t) => t.Name === GameTag.ATTACHED)?.Value === Math.abs(input.entityId),
		);
		const eatenEntityIds = enchantments
			.map((e) => e.tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value)
			.filter((id) => id);
		const eatenEntities = deckState.AllEntities.filter((e) => eatenEntityIds.includes(e.entityId));
		const eatenCards = eatenEntities.map((e) => e.cardId);
		return eatenCards;
	},
	guessCardId: (input: GuessCardIdInput): string | null => {
		const deckState = input.deckState.isOpponent
			? input.gameState.fullGameState!.Opponent
			: input.gameState.fullGameState!.Player;

		// They are not in play anymore
		const enchantments = deckState.AllEntities.filter(
			(e) =>
				e.cardId === CardIds.HungeringAncient_FeedMeEnchantment_EDR_494e &&
				e.tags?.find((t) => t.Name === GameTag.ATTACHED)?.Value === input.creatorEntityId,
		);
		const eatenEntityIds = enchantments
			.map((e) => e.tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value)
			.filter((id) => id);
		const eatenEntities = deckState.AllEntities.filter((e) => eatenEntityIds.includes(e.entityId));
		const eatenCards = eatenEntities.map((e) => e.cardId);
		return eatenCards[input.createdIndex];
	},
};
