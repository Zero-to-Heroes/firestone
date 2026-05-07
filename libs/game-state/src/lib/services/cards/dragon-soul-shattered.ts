import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from '../../models/deck-card';
import { CustomEffectCard } from './_card.type';

const SHATTERED_PIECES = [
	CardIds.DragonSoulShattered_RedAspectEssenceToken_CATA_EVENT_110t2,
	CardIds.DragonSoulShattered_BlueAspectEssenceToken_CATA_EVENT_110t3,
	CardIds.DragonSoulShattered_BronzeAspectEssenceToken_CATA_EVENT_110t4,
	CardIds.DragonSoulShattered_BlackAspectEssenceToken_CATA_EVENT_110t5,
	CardIds.DragonSoulShattered_GreenAspectEssenceToken_CATA_EVENT_110t6,
	CardIds.DragonSoulShattered_StormAspectEssenceToken_CATA_EVENT_110t7,
];

export const DragonSoulShattered: CustomEffectCard = {
	cardIds: [CardIds.DragonSoulShattered_CATA_EVENT_110],
	effects: ['CATAFX_DragonSoul_Shattered_StartOfGame_FX'],
	customEffect: ({ currentState, gameEvent, allCards }) => {
		const [, controllerId, localPlayer] = gameEvent.parse();
		const cardId = gameEvent.additionalData?.sourceCardId;
		if (!DragonSoulShattered.cardIds.includes(cardId as CardIds)) {
			return currentState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		// We do it this way instead of the additionalKnownCardsInDeck because cards are actually created, it's not
		// just an existing card about which we know have a hint
		const cardsToAdd: DeckCard[] = [];
		for (const cardId of SHATTERED_PIECES) {
			const cardData = allCards.getCard(cardId);
			cardsToAdd.push(
				DeckCard.create({
					cardId: cardId,
					entityId: undefined,
					cardName: cardData.name,
					refManaCost: cardData ? cardData.cost : undefined,
					rarity: cardData && cardData.rarity ? cardData.rarity.toLowerCase() : undefined,
					creatorCardId: gameEvent.cardId,
					creatorEntityId: gameEvent.entityId,
				}),
			);
		}
		const newDeckContents = [...deck.deck, ...cardsToAdd];
		const newDeck = deck.update({
			deck: newDeckContents,
		});
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	},
};
