import { CardIds, CardType, GameTag, hasCorrectTribe, hasMechanic, Race } from '@firestone-hs/reference-data';

import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { animalCompanionTokenCardIds } from '../card-highlight/selectors';
import { getTagWithHistory } from '../parser-entity-utils';
import { StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const AnimalCompanion: StaticGeneratingCard = {
	cardIds: [
		CardIds.AnimalCompanionCore,
		CardIds.AnimalCompanionLegacy,
		CardIds.AnimalCompanionVanilla,
		CardIds.TalyaEarthstrider_MEND_304,
		CardIds.CallOfTheWild,
		CardIds.CallOfTheWild_CORE_OG_211,
		CardIds.Spiritspeaker_MEND_301,
		CardIds.BrollBearmantle_EDR_853,
	],
	overrideDefaultDynamicPool: true,
	dynamicPool: (input: StaticGeneratingCardInput) => {
		if (!input.inputOptions.deckState.animalCompanionBufferEntityId) {
			return animalCompanionTokenCardIds;
		}
		const bufferEntity = input.inputOptions.gameState.parserState?.CurrentEntities.get(
			input.inputOptions.deckState.animalCompanionBufferEntityId!,
		);
		const newAnimalCompanions = [
			getTagWithHistory(bufferEntity, GameTag.HIDDEN_SCRIPT_DATA_4),
			getTagWithHistory(bufferEntity, GameTag.HIDDEN_SCRIPT_DATA_5),
			getTagWithHistory(bufferEntity, GameTag.HIDDEN_SCRIPT_DATA_6),
		].filter((c) => !!c);
		if (!input.inputOptions.deckState.isOpponent) {
			return newAnimalCompanions.map((c) => input.allCards.getCard(c!).id as CardIds);
		}
		// If we're dealing with the opponent, we only want to show the pool

		const newCost = input.allCards.getCard(newAnimalCompanions[0]!).cost ?? 3;
		// const realCompanions = newAnimalCompanions.map((c) => this.allCards.getCard(c!).id as CardIds);
		const cardIds = filterCards(
			CardIds.AnimalCompanionCore,
			input.allCards,
			(c) =>
				c.cost === newCost &&
				hasCorrectType(c, CardType.MINION) &&
				hasCorrectTribe(c, Race.BEAST) &&
				!hasMechanic(c, GameTag.COLOSSAL),
			input.inputOptions,
		);
		return cardIds as readonly CardIds[];
	},
};
