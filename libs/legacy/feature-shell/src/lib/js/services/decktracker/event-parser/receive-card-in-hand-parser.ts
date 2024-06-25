import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import {
	cardsConsideredPublic,
	forcedHiddenCardCreators,
	isCastWhenDrawn,
	publicCardCreators,
	specialCasePublicCardCreators,
} from '../../hs-utils';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class ReceiveCardInHandParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		if (!localPlayer) {
			console.warn('[ReceiveCardInHandParser] missing local player from event', gameEvent);
			return currentState;
		}

		const creatorCardId = gameEvent.additionalData.creatorCardId;
		const creatorEntityId = gameEvent.additionalData.creatorEntityId;

		// console.debug('[receive-card-in-hand] handling event', cardId, entityId, gameEvent);
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		// Some buffs are deduced from the creator card information, instead of being explicitly set
		// by the game
		const lastInfluencedByCardId: CardIds =
			gameEvent.additionalData?.creatorCardId ?? gameEvent.additionalData?.lastInfluencedByCardId;
		const buffingEntityCardId = gameEvent.additionalData.buffingEntityCardId;
		const buffCardId = gameEvent.additionalData.buffCardId;
		const isSpecialCasePublicWhenOpponentDraws =
			// This is starting to become one of the worst tangle of special cases in the app
			//The idea is this:
			// - Some cards let you discover cards from the opponent's hand
			// - Because of how logs work, this means we could theoretically be able to fully identify these
			// cards in hand
			// - To prevent that, we add some exception for these cards to hide the info
			// - However, when the opponent plays the cards, we still want to be able to flag them as "created by"
			// in their hand
			!forcedHiddenCardCreators.includes(lastInfluencedByCardId as CardIds) &&
			// Not sure why we would want to hide some info when the player plays the card and we're looking at
			// cards added to the player's hand
			// || (isPlayer && !hideInfoWhenPlayerPlaysIt.includes(lastInfluencedByCardId as CardIds))
			(isCastWhenDrawn(cardId, this.allCards) ||
				publicCardCreators.includes(lastInfluencedByCardId) ||
				specialCasePublicCardCreators.includes(cardId as CardIds));
		const isCardInfoPublic =
			isPlayer ||
			// Because otherwise some cards like Libram of Wisdom who generate themselves are flagged
			// with the dead entity as creator, and are never revealed
			cardsConsideredPublic.includes(cardId as CardIds) ||
			// There might be some edge cases where we don't want that, but for now it's a good approximation
			this.allCards.getCard(cardId).mechanics?.includes(GameTag[GameTag.ECHO]) ||
			this.allCards.getCard(cardId).mechanics?.includes(GameTag[GameTag.NON_KEYWORD_ECHO]) ||
			isSpecialCasePublicWhenOpponentDraws;
		// console.debug(
		// 	'[receive-card-in-hand] isCardInfoPublic',
		// 	isCardInfoPublic,
		// 	isPlayer,
		// 	cardsRevealedWhenDrawn.includes(cardId as CardIds),
		// 	cardId,
		// 	publicCardCreators.includes(lastInfluencedByCardId),
		// 	lastInfluencedByCardId,
		// );

		// First try and see if this card doesn't come from the board or from the other zone (in case of discovers)
		const boardCard = this.helper.findCardInZone(deck.board, null, entityId);
		const otherCard = this.helper.findCardInZone(deck.otherZone, null, entityId);

		// If a C'Thun piece was set aside, we know its data when getting the card back to hand, so we want to hide it
		const otherCardWithObfuscation =
			isCardInfoPublic || !otherCard
				? otherCard?.update({
						creatorCardId: creatorCardId,
				  })
				: otherCard.update({
						creatorCardId: undefined,
						cardId: undefined,
						cardName: undefined,
						lastAffectedByCardId: undefined,
				  } as DeckCard);

		const newBoard = boardCard
			? this.helper.removeSingleCardFromZone(deck.board, null, entityId, deck.deckList.length === 0)[0]
			: deck.board;
		const newOther = otherCardWithObfuscation
			? this.helper.removeSingleCardFromZone(deck.otherZone, null, entityId)[0]
			: deck.otherZone;
		// console.debug('[receive-card-in-hand] new board', newBoard, newOther);

		const cardData = cardId ? this.allCards.getCard(cardId) : null;
		const cardWithDefault =
			boardCard ||
			otherCardWithObfuscation ||
			DeckCard.create({
				cardId: isCardInfoPublic ? cardId : null,
				entityId: entityId,
				cardName: isCardInfoPublic && cardData ? this.i18n.getCardName(cardId, cardData.name) : null,
				manaCost: isCardInfoPublic && cardData ? cardData.cost : null,
				rarity: isCardInfoPublic && cardData && cardData.rarity ? cardData.rarity.toLowerCase() : null,
				creatorCardId: creatorCardId,
			} as DeckCard);
		// Because sometiomes we don't know the cardId when the card is revealed, but we can guess it when it is
		// moved to hand (e.g. Suspicious Pirate)
		// console.debug(
		// 	'[receive-card-in-hand] cardWithDefault',
		// 	cardWithDefault,
		// 	cardId,
		// 	creatorCardId,
		// 	otherCardWithObfuscation,
		// );
		const newCardId = (isCardInfoPublic ? guessCardId(cardId, deck, gameEvent) : null) ?? cardWithDefault.cardId;
		const cardWithKnownInfo =
			newCardId === cardWithDefault.cardId
				? cardWithDefault
				: cardWithDefault.update({
						cardId: newCardId,
						cardName: this.allCards.getCard(newCardId).name,
						manaCost: this.allCards.getCard(newCardId).cost,
						rarity: this.allCards.getCard(newCardId).rarity?.toLowerCase(),
				  });
		const cardWithZone = cardWithKnownInfo.update({
			zone: 'HAND',
		});
		// console.debug(
		// 	'[receive-card-in-hand] cardWithDefault',
		// 	cardWithKnownInfo,
		// 	cardWithDefault,
		// 	creatorCardId,
		// 	otherCard,
		// 	otherCardWithObfuscation,
		// );

		const otherCardWithBuffs =
			buffingEntityCardId != null || buffCardId != null
				? cardWithZone.update({
						buffingEntityCardIds: [
							...(cardWithDefault.buffingEntityCardIds || []),
							buffingEntityCardId,
						] as readonly string[],
						buffCardIds: [...(cardWithZone.buffCardIds || []), buffCardId] as readonly string[],
				  } as DeckCard)
				: cardWithZone;
		const cardWithGuessedInfo = addGuessedInfo(otherCardWithBuffs, gameEvent);
		const cardWithAdditionalAttributes = addAdditionalAttribues(
			cardWithGuessedInfo,
			deck,
			gameEvent,
			this.allCards,
		);
		// console.debug(
		// 	'[receive-card-in-hand] cardWithAdditionalAttributes',
		// 	cardWithAdditionalAttributes,
		// 	otherCardWithBuffs,
		// );
		const previousHand = deck.hand;
		const newHand: readonly DeckCard[] = this.helper.addSingleCardToZone(
			previousHand,
			cardWithAdditionalAttributes,
			// We keep the buffs for Secret Passage. If this causes an info leak, it should be documented
			// here
			true,
		);
		// It's important to insert the card at the right position, because links use positioning
		// TODO: integrate that directly into the "addSingleCardToZone" method
		let handAfterReposition: DeckCard[] = [];
		if (gameEvent.additionalData?.position != null && !!cardWithAdditionalAttributes.entityId) {
			for (let i = 0; i < newHand.length; i++) {
				if (newHand[i].entityId === cardWithAdditionalAttributes.entityId) {
					handAfterReposition.splice(gameEvent.additionalData?.position, 0, cardWithAdditionalAttributes);
				} else {
					handAfterReposition.push(newHand[i]);
				}
			}
		} else {
			handAfterReposition = [...newHand];
		}
		// For cards that duplicate cards in hand, like Elementary Reaction or Lady Deathwhisper
		const handAfterCardInference: readonly DeckCard[] = this.addCardLinks(
			handAfterReposition,
			entityId,
			creatorCardId,
		);
		// console.debug('[receive-card-in-hand] new hand', handAfterCardInference);

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: handAfterCardInference,
			board: newBoard,
			otherZone: newOther,
			abyssalCurseHighestValue:
				cardWithAdditionalAttributes.cardId === CardIds.SirakessCultist_AbyssalCurseToken
					? Math.max(
							deck.abyssalCurseHighestValue ?? 0,
							// When you are the active player, it's possible that the info comes from the FULL_ENTITY node itself,
							// while it is in the ENTITY_UPDATE event for the opponent
							!!gameEvent.additionalData.dataNum1 && gameEvent.additionalData.dataNum1 !== -1
								? gameEvent.additionalData.dataNum1
								: cardWithAdditionalAttributes.mainAttributeChange + 1,
					  )
					: deck.abyssalCurseHighestValue,
		} as DeckState);
		// console.debug('[receive-card-in-hand] deckState', newPlayerDeck);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	private addCardLinks(hand: readonly DeckCard[], entityId: number, creatorCardId: string): readonly DeckCard[] {
		switch (creatorCardId) {
			case CardIds.ElementaryReaction:
			case CardIds.LadyDeathwhisper_RLK_713:
				const positionIndex = hand.map((c) => c.entityId).indexOf(entityId);
				// console.debug('positionIndex', positionIndex, hand, entityId, creatorCardId);
				const card = hand[positionIndex];
				const linkedCard = hand[positionIndex - 1];
				const newCard = card.update({
					cardCopyLink: linkedCard?.entityId,
				});
				const newLinkedCard = linkedCard.update({
					cardCopyLink: card?.entityId,
				});
				const afterNewCard1 = this.helper.replaceCardInZone(hand, newCard);
				const afterNewCard2 = this.helper.replaceCardInZone(afterNewCard1, newLinkedCard);
				// console.debug('after replacing copies', afterNewCard2, afterNewCard1, newCard, linkedCard, card);
				return afterNewCard2;
			default:
				return hand;
		}
	}

	event(): string {
		return GameEvent.RECEIVE_CARD_IN_HAND;
	}
}

export const addAdditionalAttribues = (
	card: DeckCard,
	deck: DeckState,
	gameEvent: GameEvent,
	allCards: CardsFacadeService,
): DeckCard => {
	switch (card?.cardId) {
		case CardIds.SirakessCultist_AbyssalCurseToken:
			const knownCurses = deck
				.getAllCardsInDeck()
				.filter((c) => c.cardId === CardIds.SirakessCultist_AbyssalCurseToken);
			// console.debug('[receive-card-in-hand] knownCurses', knownCurses);
			const highestAttribute = !!knownCurses.length
				? Math.max(...knownCurses.map((c) => (c as DeckCard).mainAttributeChange ?? 0))
				: -1;
			// console.debug('[receive-card-in-hand] highestAttribute', highestAttribute);
			return card.update({
				mainAttributeChange:
					!!gameEvent.additionalData.dataNum1 && gameEvent.additionalData.dataNum1 !== -1
						? // dataNum1 is the base value, while we start our count at 0
						  gameEvent.additionalData.dataNum1 - 1
						: highestAttribute + 1,
			});
		case CardIds.SchoolTeacher_NagalingToken:
			return card.update({
				relatedCardIds: [
					...card.relatedCardIds,
					allCards.getCardFromDbfId(gameEvent.additionalData.additionalPlayInfo).id,
				].filter((id) => !!id),
			});
		case CardIds.EliteTaurenChampion_MoltenPickOfRockToken:
			return card.update({
				mainAttributeChange: gameEvent.additionalData.dataNum1 - 8,
			});
	}
	return card;
};

const addGuessedInfo = (card: DeckCard, gameEvent: GameEvent): DeckCard => {
	switch (gameEvent.additionalData.creatorCardId) {
		case CardIds.HarthStonebrew_CORE_GIFT_01:
		case CardIds.HarthStonebrew_GIFT_01:
			return card.update({
				creatorAdditionalInfo: gameEvent.additionalData.position,
			});
	}
	return card;
};

const guessCardId = (cardId: string, deckState: DeckState, gameEvent: GameEvent): string => {
	// console.debug('[receive-card-in-hand] guessing cardId', cardId, deckState, gameEvent);
	if (!!cardId?.length) {
		return cardId;
	}
	switch (gameEvent.additionalData.creatorCardId) {
		case CardIds.Repackage_RepackagedBoxToken_TOY_879t:
			const existingBox: DeckCard = deckState.otherZone.find(
				(c) => Math.abs(c.entityId) === gameEvent.additionalData.creatorEntityId,
			);
			// console.debug(
			// 	'[receive-card-in-hand] existingBox',
			// 	existingBox,
			// 	deckState.otherZone,
			// 	gameEvent.additionalData.creatorEntityId,
			// );
			const guessedCardId = existingBox?.relatedCardIds?.[0];
			// console.debug('[receive-card-in-hand] guessedCardId', guessedCardId, existingBox?.relatedCardIds);
			if (guessedCardId) {
				// FIXME: didn't want to have to handle a full DeckState return for this
				(existingBox as any).relatedCardIds = existingBox.relatedCardIds.slice(1);
				// console.debug('[receive-card-in-hand] updated box', existingBox);
				return guessedCardId;
			}
	}
	return cardId;
};
