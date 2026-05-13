import { CardIds, CardType, GameTag, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import { hasCorrectType } from '../../related-cards/dynamic-pools';
import { getTagWithHistory } from '../parser-entity-utils';
import { CustomEffectCard, StaticGeneratingCard, StaticGeneratingCardInput } from './_card.type';
import { filterCards } from './utils';

export const animalCompanionBuffsCardIds: readonly CardIds[] = [
	CardIds.TamePet_MEND_300,
	CardIds.MigratingElekk_MEND_303,
	CardIds.RoamFree_MEND_307,
];

export const AnimalCompanionBuffs: CustomEffectCard & StaticGeneratingCard = {
	cardIds: animalCompanionBuffsCardIds,
	effects: ['CATAFX_TamePet_Reveal_Fadeout_Super', 'CATAFX_TamePet_Reveal_Super'],
	customEffect: ({ currentState, gameEvent, allCards }) => {
		const [, controllerId, localPlayer] = gameEvent.parse();
		const cardId = gameEvent.additionalData?.sourceCardId;
		if (!animalCompanionBuffsCardIds.includes(cardId as CardIds)) {
			return currentState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const entityId = gameEvent.additionalData?.sourceEntityId;
		// const entity = deck.findCard(entityId)?.card;
		// console.debug('[debug] animal companion buffs', entity, gameEvent, currentState);
		const newDeck = deck.update({
			animalCompanionBufferEntityId: entityId,
		});
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	},
	dynamicPool: (input: StaticGeneratingCardInput) => {
		const bufferEntity = input.inputOptions.gameState.parserState?.CurrentEntities.get(
			input.inputOptions.deckState.animalCompanionBufferEntityId!,
		);

		const currentCompanionSample = getTagWithHistory(bufferEntity, GameTag.TAG_SCRIPT_DATA_NUM_4);
		const currentCompanionCost = input.allCards.getCard(currentCompanionSample!).cost ?? 3;
		const costBuff =
			input.cardId === CardIds.RoamFree_MEND_307 ? currentCompanionCost + 2 : currentCompanionCost + 1;
		const possibleCards = filterCards(
			input.cardId,
			input.allCards,
			(c) => c.cost === costBuff && hasCorrectType(c, CardType.MINION) && hasCorrectTribe(c, Race.BEAST),
			input.inputOptions,
		);
		return possibleCards;
	},
};
