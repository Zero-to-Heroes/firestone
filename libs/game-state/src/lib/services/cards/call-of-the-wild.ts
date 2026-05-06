import { CardIds, GameTag } from '@firestone-hs/reference-data';

import { animalCompanionTokenCardIds } from '../card-highlight/selectors';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';

export const CallOfTheWild: StaticGeneratingCard = {
	cardIds: [CardIds.CallOfTheWild, CardIds.CallOfTheWild_CORE_OG_211],
	overrideDefaultDynamicPool: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		if (!input.inputOptions.deckState.animalCompanionBufferEntityId) {
			return animalCompanionTokenCardIds;
		}
		const bufferEntity = input.inputOptions.gameState.parserState?.CurrentEntities.get(
			input.inputOptions.deckState.animalCompanionBufferEntityId!,
		);
		return [
			input.allCards.getCard(
				bufferEntity!.Tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_4)?.Value ?? 0,
			).id,
			input.allCards.getCard(
				bufferEntity!.Tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_5)?.Value ?? 0,
			).id,
			input.allCards.getCard(
				bufferEntity!.Tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_6)?.Value ?? 0,
			).id,
		];
	},
};
