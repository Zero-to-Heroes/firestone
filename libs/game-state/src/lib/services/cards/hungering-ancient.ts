/* eslint-disable no-mixed-spaces-and-tabs */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { getEntityTag } from '../../services/parser-entity-utils';
import { GeneratingCard, GuessCardIdInput, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const HungeringAncient: GeneratingCard & StaticGeneratingCard = {
	cardIds: [CardIds.HungeringAncient_EDR_494],
	publicCreator: true,
	dynamicPool: (input: StaticGeneratingCardInput): readonly string[] => {
		const currentEntities = input.inputOptions.gameState.parserState?.CurrentEntities;
		if (!currentEntities) return [];
		const enchantments = [...currentEntities.values()].filter(
			(e) =>
				e.CardId === CardIds.HungeringAncient_FeedMeEnchantment_EDR_494e &&
				getEntityTag(e, GameTag.ATTACHED) === Math.abs(input.entityId),
		);
		const eatenEntityIds = enchantments
			.map((e) => getEntityTag(e, GameTag.TAG_SCRIPT_DATA_NUM_1))
			.filter((id) => id > 0);
		const eatenEntities = eatenEntityIds.map((id) => currentEntities.get(id)).filter((e) => !!e);
		const eatenCards = eatenEntities.map((e) => e!.CardId);
		return eatenCards;
	},
	guessCardId: (input: GuessCardIdInput): string | null => {
		const currentEntities = input.gameState.parserState?.CurrentEntities;
		if (!currentEntities) return null;
		const enchantments = [...currentEntities.values()].filter(
			(e) =>
				e.CardId === CardIds.HungeringAncient_FeedMeEnchantment_EDR_494e &&
				getEntityTag(e, GameTag.ATTACHED) === input.creatorEntityId,
		);
		const eatenEntityIds = enchantments
			.map((e) => getEntityTag(e, GameTag.TAG_SCRIPT_DATA_NUM_1))
			.filter((id) => id > 0);
		const eatenEntities = eatenEntityIds.map((id) => currentEntities.get(id)).filter((e) => !!e);
		const eatenCards = eatenEntities.map((e) => e!.CardId);
		return eatenCards[input.createdIndex];
	},
};
