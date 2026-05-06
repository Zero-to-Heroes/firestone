import { AllCardsService, CardIds, GameTag } from '@firestone-hs/reference-data';
import { DeckCard } from '../../models/deck-card';
import { CustomEffectCard } from './_card.type';

export const animalCompanionBuffsCardIds: readonly CardIds[] = [
	CardIds.TamePet_MEND_300,
	CardIds.MigratingElekk_MEND_303,
	CardIds.RoamFree_MEND_307,
];

export const AnimalCompanionBuffs: CustomEffectCard = {
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
};

const companion = (entity: DeckCard, tag: GameTag, fallback: GameTag, allCards: AllCardsService) => {
	return allCards.getCard(entity!.tags[tag]!).id ?? allCards.getCard(entity!.tags[fallback]!).id;
};
