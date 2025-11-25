import { CardIds, CardType, GameTag, hasCorrectTribe, Race } from '@firestone-hs/reference-data';
import {
	addGuessInfoToCard,
	cardsInfoCache,
	DeckCard,
	DeckState,
	GameState,
	GeneratingCard,
	getProcessedCard,
	toTagsObject,
} from '@firestone/game-state';
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
import { revealCardInOpponentDeck } from '../game-state/card-reveal';
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
		const [cardIdOrDbfId, controllerId, localPlayer, entityId] = gameEvent.parse();
		if (!localPlayer) {
			console.warn('[ReceiveCardInHandParser] missing local player from event', gameEvent);
			return currentState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const opponentDeck = isPlayer ? currentState.opponentDeck : currentState.playerDeck;

		const cardId = this.allCards.getCard(cardIdOrDbfId)?.id;
		const { creatorCardId, creatorEntityId } = denormalizeCreatorCardId(
			gameEvent.additionalData.creatorCardId,
			gameEvent.additionalData.creatorEntityId,
			deck,
		);
		// console.debug(
		// 	'creatorCardId',
		// 	creatorCardId,
		// 	creatorEntityId,
		// 	gameEvent,
		// 	deck,
		// 	deck.findCard(gameEvent.additionalData.creatorEntityId),
		// );

		// Some buffs are deduced from the creator card information, instead of being explicitly set
		// by the game
		const lastInfluencedByCardId: CardIds = creatorCardId ?? gameEvent.additionalData?.lastInfluencedByCardId;
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
		console.debug(
			'[receive-card-in-hand] isCardInfoPublic',
			isCardInfoPublic,
			isPlayer,
			cardId,
			publicCardCreators.includes(lastInfluencedByCardId),
			lastInfluencedByCardId,
		);

		// First try and see if this card doesn't come from the board or from the other zone (in case of discovers)
		const boardCard = this.helper.findCardInZone(deck.board, null, entityId);
		const otherCard = this.helper.findCardInZone(deck.otherZone, null, entityId);

		const createdIndex = gameEvent.additionalData.createdIndex;
		// If a C'Thun piece was set aside, we know its data when getting the card back to hand, so we want to hide it
		const otherCardWithObfuscation =
			isCardInfoPublic || !otherCard
				? otherCard?.update({
						creatorCardId: creatorCardId,
						creatorEntityId: creatorEntityId,
						createdIndex: createdIndex,
					})
				: otherCard.update({
						creatorCardId: undefined,
						creatorEntityId: undefined,
						cardId: undefined,
						cardName: undefined,
						lastAffectedByCardId: undefined,
						lastAffectedByEntityId: undefined,
						createdIndex: undefined,
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
				cardName: isCardInfoPublic && cardData ? cardData.name : null,
				refManaCost: isCardInfoPublic && cardData ? cardData.cost : null,
				rarity: isCardInfoPublic && cardData && cardData.rarity ? cardData.rarity.toLowerCase() : null,
				creatorCardId: creatorCardId,
				creatorEntityId: creatorEntityId,
				createdIndex: createdIndex,
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
		const newCardId =
			(isCardInfoPublic
				? guessCardId(cardId, deck, opponentDeck, creatorCardId, creatorEntityId, createdIndex, this.allCards)
				: null) ?? cardWithDefault.cardId;
		const cardWithKnownInfo =
			newCardId === cardWithDefault.cardId
				? cardWithDefault
				: cardWithDefault.update({
						cardId: newCardId,
						cardName: this.allCards.getCard(newCardId).name,
						refManaCost: this.allCards.getCard(newCardId).cost,
						rarity: this.allCards.getCard(newCardId).rarity?.toLowerCase(),
					});
		const cardWithZone = cardWithKnownInfo.update({
			zone: 'HAND',
			tags: gameEvent.additionalData.tags ? toTagsObject(gameEvent.additionalData.tags) : cardWithKnownInfo.tags,
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
		const cardWithGuessedInfo = addGuessInfoToCard(
			otherCardWithBuffs,
			creatorCardId,
			null,
			deck,
			opponentDeck,
			this.allCards,
			{
				positionInHand: gameEvent.additionalData.position,
				tags: gameEvent.additionalData.tags,
				metadata: currentState.metadata,
			},
		);
		const cardWithAdditionalAttributes = addAdditionalAttribuesInHand(
			cardWithGuessedInfo,
			deck,
			gameEvent.additionalData.dataNum1,
			gameEvent.additionalData.dataNum2,
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

		const playerDeckAfterReveal = isPlayer ? newPlayerDeck : currentState.playerDeck;
		const opponentDeckAfterReveal = isPlayer
			? revealCardInOpponentDeck(newPlayerDeck, cardWithZone, currentState.opponentDeck, currentState)
			: newPlayerDeck;

		return currentState.update({
			playerDeck: playerDeckAfterReveal,
			opponentDeck: opponentDeckAfterReveal,
		});
	}

	private addCardLinks(hand: readonly DeckCard[], entityId: number, creatorCardId: string): readonly DeckCard[] {
		switch (creatorCardId) {
			case CardIds.ElementaryReaction:
			case CardIds.LadyDeathwhisper_RLK_713:
			case CardIds.RangariScout_GDB_841:
				// const sortedHand = [...hand].sort(
				// 	(a, b) => (a.tags?.[GameTag.ZONE_POSITION] ?? 0) - (b.tags?.[GameTag.ZONE_POSITION] ?? 0),
				// );
				// Assume it's already sorted, more or less - the last received card should be the last one, at least
				// for the cases we are interested in (cards are drawn from the deck, not changed in hand)
				const positionIndex = hand.map((c) => c.entityId).indexOf(entityId);
				// console.debug(
				// 	'positionIndex',
				// 	entityId,
				// 	positionIndex,
				// 	sortedHand,
				// 	sortedHand.map((c) => c.tags?.[GameTag.ZONE_POSITION]),
				// 	sortedHand.map((c) => c.entityId),
				// 	sortedHand.map((c) => {
				// 		const newC = { ...c };
				// 		return newC.tags;
				// 	}),
				// 	sortedHand.map((c) => JSON.stringify(c.tags)),
				// );
				// console.debug('positionIndex', positionIndex, hand, entityId, creatorCardId);
				const card = hand[positionIndex];
				const linkedCard = hand[positionIndex - 1];
				// console.debug('linkedCard', linkedCard, card, hand, creatorCardId);
				const newCard = card.update({
					cardCopyLinks: [linkedCard?.entityId],
				});
				const newLinkedCard = linkedCard.update({
					cardCopyLinks: [card?.entityId],
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

export const addAdditionalAttribuesInHand = (
	card: DeckCard,
	deck: DeckState,
	dataNum1: number,
	dataNum2: number,
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
					!!dataNum1 && dataNum1 !== -1
						? // dataNum1 is the base value, while we start our count at 0
							dataNum1 - 1
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
		case CardIds.TheRyecleaver_MinionSandwichToken_VAC_525t2:
			return gameEvent.additionalData?.referencedCardIds?.length
				? card.update({
						relatedCardIds: gameEvent.additionalData.referencedCardIds,
					})
				: card;
	}
	return card;
};

const guessCardId = (
	cardId: string,
	deckState: DeckState,
	opponentDeckState: DeckState,
	creatorCardId: string,
	creatorEntityId: number,
	createdIndex: number,
	allCards: CardsFacadeService,
): string => {
	// console.debug('[receive-card-in-hand] guessing cardId', cardId, deckState, gameEvent);
	if (!!cardId?.length) {
		return cardId;
	}

	// Assuming the mini is always created first, which seems to be the case
	if (
		createdIndex === 0 &&
		allCards.getCard(creatorCardId).mechanics?.includes(GameTag[GameTag.MINIATURIZE]) &&
		!allCards.getCard(creatorCardId).mechanics?.includes(GameTag[GameTag.GIGANTIFY])
	) {
		const tentativeMiniCard = allCards.getCard(creatorCardId + 't');
		if (tentativeMiniCard.mechanics?.includes(GameTag[GameTag.MINI])) {
			return tentativeMiniCard.id;
		}
	}
	if (
		createdIndex === 0 &&
		allCards.getCard(creatorCardId).mechanics?.includes(GameTag[GameTag.GIGANTIFY]) &&
		!allCards.getCard(creatorCardId).mechanics?.includes(GameTag[GameTag.MINIATURIZE])
	) {
		const tentativeMiniCard = allCards.getCard(creatorCardId + 't');
		if (tentativeMiniCard.mechanics?.includes(GameTag[GameTag.GIGANTIC])) {
			return tentativeMiniCard.id;
		}
	}

	switch (creatorCardId) {
		case CardIds.Repackage_RepackagedBoxToken_TOY_879t:
			if (true) {
				const existingBox: DeckCard = deckState.otherZone.find((c) => Math.abs(c.entityId) === creatorEntityId);
				const guessedCardId = existingBox?.relatedCardIds?.[0];
				if (guessedCardId) {
					// FIXME: didn't want to have to handle a full DeckState return for this
					(existingBox as any).relatedCardIds = existingBox.relatedCardIds.slice(1);
					return guessedCardId;
				}
			}
			break;
		case CardIds.AstralVigilant_GDB_461:
			return deckState.cardsPlayedThisMatch
				.map((c) => getProcessedCard(c.cardId, c.entityId, deckState, allCards))
				.filter((c) => c?.type?.toUpperCase() === CardType[CardType.MINION] && hasCorrectTribe(c, Race.DRAENEI))
				.pop()?.id;
		case CardIds.MonstrousParrot:
			return deckState.minionsDeadThisMatch
				.map((c) => getProcessedCard(c.cardId, c.entityId, deckState, allCards))
				.filter((c) => c.mechanics?.includes(GameTag[GameTag.DEATHRATTLE]))
				.pop()?.id;
		case CardIds.RoyalInformant_TIME_036:
			return [...opponentDeckState.hand]
				.sort((a, b) => a.tags?.[GameTag.ZONE_POSITION] - b.tags?.[GameTag.ZONE_POSITION])
				.pop()?.cardId;
		default:
			const guessedCardId = (
				cardsInfoCache[creatorCardId as keyof typeof cardsInfoCache] as GeneratingCard
			)?.guessCardId?.(
				cardId,
				deckState,
				opponentDeckState,
				creatorCardId,
				creatorEntityId,
				createdIndex,
				allCards.getService(),
			);
			return guessedCardId ?? cardId;
	}
	return cardId;
};

export const denormalizeCreatorCardId = (
	creatorCardId: string,
	creatorEntityId: number,
	deck: DeckState,
): { creatorCardId: string; creatorEntityId: number } => {
	switch (creatorCardId) {
		case CardIds.DarkGiftToken_EDR_102t:
		case CardIds.SweetDreamsToken_EDR_100t8:
		case CardIds.WakingTerrorToken_EDR_100t:
		case CardIds.WellRestedToken_EDR_100t1:
		case CardIds.ShortClawsToken_EDR_100t2:
		case CardIds.BundledUpToken_EDR_100t3:
		case CardIds.LivingNightmareToken_EDR_100t5:
		case CardIds.SleepwalkerToken_EDR_100t6:
		case CardIds.RudeAwakeningToken_EDR_100t7:
		case CardIds.PersistingHorrorToken_EDR_100t9:
		case CardIds.HarpysTalonsToken_EDR_100t13:
			const card = deck.findCard(creatorEntityId)?.card;
			return card
				? { creatorCardId: card.creatorCardId, creatorEntityId: card.creatorEntityId }
				: { creatorCardId, creatorEntityId };
		default:
			return { creatorCardId, creatorEntityId };
	}
};
