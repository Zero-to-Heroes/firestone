import { CardIds, CardType, GameTag, hasCorrectTribe, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { ArenaRefService } from '@firestone/arena/data-access';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard, toTagsObject } from '../../../models/deck-card';
import { DeckState } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { addGuessInfoToCard, getProcessedCard } from '../../card-utils';
import { hasGeneratingCard } from '../../cards/_card.type';
import { cardsInfoCache } from '../../cards/_mapping';
import { IridaSinseeker } from '../../cards/irida-sinseeker';
import {
	cardsConsideredPublic,
	forcedHiddenCardCreators,
	isCastWhenDrawn,
	publicCardCreators,
	SHATTER_HAND_PIECE_CREATOR_FALLBACK_CARD_IDS,
	specialCasePublicCardCreators,
} from '../../hs-utils';
import { revealCardInOpponentDeck } from '../card-reveal';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

const CREATOR_STEALS: readonly CardIds[] = [
	// CardIds.NightmareFuel_EDR_528
];

/**
 * Cosmetic set coins (e.g. TLC_COIN2) may appear in logs before reference data includes them, or may
 * resolve to a non–GAME_005 id while still being the standard extra-mana coin. Normalize using COIN_CARD
 * tags or ReferenceCard.isCoin from the cards DB; unknown ids fall back to a /_COIN/ id heuristic.
 */
function resolveCardIdForReceiveInHand(
	cardIdOrDbfId: string | number,
	tags: readonly { Name: number; Value: number }[] | undefined,
	allCards: CardsFacadeService,
): string | undefined {
	const coinFromTags = tags?.some((t) => t.Name === (GameTag.COIN_CARD as number) && t.Value === 1);
	if (coinFromTags) {
		return CardIds.TheCoinCore;
	}
	const refCard = allCards.getCard(cardIdOrDbfId);
	if (refCard) {
		// Cosmetic coins have their own id in reference data but isCoin marks them as The Coin for UI.
		if (refCard.isCoin) {
			return CardIds.TheCoinCore;
		}
		return refCard.id;
	}
	if (typeof cardIdOrDbfId === 'string' && /_COIN/i.test(cardIdOrDbfId)) {
		return CardIds.TheCoinCore;
	}
	return undefined;
}

export class ReceiveCardInHandParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly arenaRefService: ArenaRefService,
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

		const debug = cardIdOrDbfId === 'EX1_067';
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const opponentDeck = isPlayer ? currentState.opponentDeck : currentState.playerDeck;

		const cardId = resolveCardIdForReceiveInHand(cardIdOrDbfId, gameEvent.additionalData.tags, this.allCards);
		debug && console.debug('cardId', cardId);
		let { creatorCardId, creatorEntityId } = denormalizeCreatorCardId(
			gameEvent.additionalData.creatorCardId,
			gameEvent.additionalData.creatorEntityId,
			deck,
		);
		debug && console.debug('creatorCardId', creatorCardId, creatorEntityId);
		// Shatter hand pieces may omit CREATOR in the log; infer Spark of Life or Sands of Time from cards played this match (most recent wins).
		if (!creatorCardId && !isPlayer) {
			const tags = gameEvent.additionalData?.tags ?? [];
			const isShattered = tags.some((t) => t.Name === (GameTag.SHATTERED as number) && t.Value === 1);
			if (isShattered) {
				const sourcePlayed = [...(deck.cardsPlayedThisMatch ?? [])]
					.reverse()
					.find(
						(c) =>
							c.cardId != null &&
							(SHATTER_HAND_PIECE_CREATOR_FALLBACK_CARD_IDS as readonly string[]).includes(c.cardId),
					);
				if (sourcePlayed) {
					creatorCardId = sourcePlayed.cardId as CardIds;
					creatorEntityId = sourcePlayed.entityId;
				}
			}
		}
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
		// UPDATE 2026-01-23: we want to first pick the lastInfluencedByCardId from the event, because this is used by cards
		// like Rangari Scout to build card links, and it might be different from the creatorCardId
		const rawLastInfluencedBy = gameEvent.additionalData?.lastInfluencedByCardId;
		const lastInfluencedByCardId: CardIds = (
			rawLastInfluencedBy && rawLastInfluencedBy.length > 0 ? rawLastInfluencedBy : creatorCardId
		) as CardIds;
		const buffingEntityCardId = gameEvent.additionalData.buffingEntityCardId;
		const buffCardId = gameEvent.additionalData.buffCardId;
		debug && console.debug('lastInfluencedByCardId', lastInfluencedByCardId, rawLastInfluencedBy, creatorCardId);
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
			((!!cardId && isCastWhenDrawn(cardId, this.allCards)) ||
				publicCardCreators.includes(lastInfluencedByCardId as CardIds) ||
				publicCardCreators.includes(creatorCardId as CardIds) ||
				specialCasePublicCardCreators.includes(cardId as CardIds));
		debug &&
			console.debug(
				'isSpecialCasePublicWhenOpponentDraws',
				isSpecialCasePublicWhenOpponentDraws,
				lastInfluencedByCardId,
				cardId,
				publicCardCreators.includes(lastInfluencedByCardId as CardIds),
				specialCasePublicCardCreators.includes(cardId as CardIds),
			);
		const refForPublicCheck = cardId ? this.allCards.getCard(cardId) : null;
		const isCardInfoPublic =
			isPlayer ||
			// Because otherwise some cards like Libram of Wisdom who generate themselves are flagged
			// with the dead entity as creator, and are never revealed
			cardsConsideredPublic.includes(cardId as CardIds) ||
			// The Coin (incl. cosmetic coins): not a secret — both players know who has the extra card.
			(!!cardId && refForPublicCheck?.isCoin === true) ||
			// There might be some edge cases where we don't want that, but for now it's a good approximation
			(!!cardId &&
				(this.allCards.getCard(cardId).mechanics?.includes(GameTag[GameTag.ECHO]) ||
					this.allCards.getCard(cardId).mechanics?.includes(GameTag[GameTag.NON_KEYWORD_ECHO]))) ||
			isSpecialCasePublicWhenOpponentDraws;
		debug &&
			console.debug(
				'[receive-card-in-hand] isCardInfoPublic',
				isCardInfoPublic,
				isPlayer,
				cardId,
				publicCardCreators.includes(lastInfluencedByCardId as CardIds),
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
					});

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
				? guessCardId(
						cardId,
						deck,
						opponentDeck,
						currentState,
						creatorCardId,
						creatorEntityId,
						createdIndex,
						this.allCards,
					)
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
			stolenFromOpponent: CREATOR_STEALS.includes(creatorCardId as CardIds) ? true : undefined,
			// So that cards don't keep info from their previous zones, or when they were previously in hand
			// metaInfo: {
			// 	turnAtWhichCardEnteredCurrentZone: currentState.currentTurnNumeric,
			// 	turnAtWhichCardEnteredHand: currentState.currentTurnNumeric,
			// 	timestampAtWhichCardEnteredHand: new Date().getTime(),
			// },
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
			creatorEntityId,
			deck,
			opponentDeck,
			currentState,
			this.allCards,
			{
				positionInHand: gameEvent.additionalData.position,
				tags: gameEvent.additionalData.tags,
				metadata: currentState.metadata,
				creatorZone: gameEvent.additionalData.creatorZone,
				validArenaPool: this.arenaRefService.validDiscoveryPool$$.value ?? [],
				creatorTags: gameEvent.additionalData.creatorTags,
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
			lastInfluencedByCardId,
		);
		// console.debug('[receive-card-in-hand] new hand', handAfterCardInference);

		const newCardsAddedToHand = cardId
			? [
					...(deck.cardsAddedToHand ?? []),
					{ cardId: cardId, entityId: entityId, turn: currentState.currentTurnNumeric },
				]
			: deck.cardsAddedToHand;

		const newVoid =
			creatorCardId === CardIds.IridaSinseeker_TheVoidEnchantment_JAIL_719e2
				? IridaSinseeker.cardReceivedFromTheVoid(cardWithZone, deck.voidZone)
				: undefined;

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: handAfterCardInference,
			board: newBoard,
			otherZone: newOther,
			voidZone: newVoid,
			cardsAddedToHand: newCardsAddedToHand,
			abyssalCurseHighestValue:
				cardWithAdditionalAttributes.cardId === CardIds.SirakessCultist_AbyssalCurseToken
					? Math.max(
							deck.abyssalCurseHighestValue ?? 0,
							// When you are the active player, it's possible that the info comes from the FULL_ENTITY node itself,
							// while it is in the ENTITY_UPDATE event for the opponent
							!!gameEvent.additionalData.dataNum1 && gameEvent.additionalData.dataNum1 !== -1
								? gameEvent.additionalData.dataNum1
								: (cardWithAdditionalAttributes.mainAttributeChange ?? 0) + 1,
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

	private addCardLinks(
		hand: readonly DeckCard[],
		entityId: number,
		lastInfluencedByCardId: string,
	): readonly DeckCard[] {
		switch (lastInfluencedByCardId) {
			// Divergence: splits one in-hand minion into two tokens. They share creatorCardId + creatorEntityId
			// (the played spell). Never pair via hand[positionIndex - 1]: at positionIndex 0, JS uses hand[-1]
			// (last card) and links an unrelated card (e.g. Hellfire) to the split half.
			case CardIds.Divergence_TIME_030:
				return this.linkDivergenceSplitHandPartners(hand, entityId);
			case CardIds.ElementaryReaction:
			case CardIds.LadyDeathwhisper_RLK_713:
			case CardIds.PuppetmasterDorian_MIS_026:
			case CardIds.RangariScout_GDB_841:
			case CardIds.DryscaleDeputy_DryscaleDeputyEnchantment_WW_383e:
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

	/** Pair the two hand rows created by the same Divergence play (same spell entity id). */
	private linkDivergenceSplitHandPartners(hand: readonly DeckCard[], entityId: number): readonly DeckCard[] {
		const card = hand.find((c) => c.entityId === entityId);
		const spellEntityId = card?.creatorEntityId;
		if (!card || spellEntityId == null || card.creatorCardId !== CardIds.Divergence_TIME_030) {
			return hand;
		}
		const partner = hand.find(
			(c) =>
				c.entityId !== entityId &&
				c.creatorEntityId === spellEntityId &&
				c.creatorCardId === CardIds.Divergence_TIME_030,
		);
		if (!partner) {
			return hand;
		}
		const newCard = card.update({ cardCopyLinks: [partner.entityId] });
		const newPartner = partner.update({ cardCopyLinks: [card.entityId] });
		let next = this.helper.replaceCardInZone(hand, newCard);
		next = this.helper.replaceCardInZone(next, newPartner);
		return next;
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
		case CardIds.Torch_CATA_585:
		case CardIds.BlackwingExperiment_DragonBreathToken_CATA_464t: {
			const storedAmount = gameEvent.additionalData?.storedAmount;
			return storedAmount != null && storedAmount > 0 ? card.update({ mainAttributeChange: storedAmount }) : card;
		}
		case CardIds.InvasiveShadeleaf_BottledShadeleafToken_WW_393t:
		case CardIds.HolySpringwater_BottledSpringwaterToken_WW_395t: {
			const fromTags = gameEvent.additionalData?.tags?.find(
				(t) => t.Name === (GameTag.TAG_SCRIPT_DATA_NUM_1 as number),
			)?.Value;
			const storedAmount = gameEvent.additionalData?.storedAmount;
			const n = fromTags != null && fromTags > 0 ? fromTags : storedAmount;
			return n != null && n > 0 ? card.update({ mainAttributeChange: n }) : card;
		}
	}
	return card;
};

const guessCardId = (
	cardId: string | undefined,
	deckState: DeckState,
	opponentDeckState: DeckState,
	gameState: GameState,
	creatorCardId: string,
	creatorEntityId: number,
	createdIndex: number,
	allCards: CardsFacadeService,
): string | undefined => {
	// console.debug('[receive-card-in-hand] guessing cardId', cardId, deckState, gameEvent);
	if (!!cardId?.length) {
		return cardId;
	}

	switch (creatorCardId) {
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
				.sort((a, b) => (a.tags?.[GameTag.ZONE_POSITION] ?? 0) - (b.tags?.[GameTag.ZONE_POSITION] ?? 0))
				.pop()?.cardId;
		default:
			const cardImpl = cardsInfoCache[creatorCardId];
			if (hasGeneratingCard(cardImpl)) {
				const guessedCardId = cardImpl.guessCardId?.({
					cardId: cardId,
					deckState: deckState,
					opponentDeckState: opponentDeckState,
					gameState: gameState,
					creatorCardId: creatorCardId,
					creatorEntityId: creatorEntityId,
					createdIndex: createdIndex,
					allCards: allCards.getService(),
				});
				if (guessedCardId) {
					return guessedCardId;
				}
			}
			break;
	}

	// Assuming the mini is always created first, which seems to be the case
	if (
		createdIndex === 0 &&
		allCards.getCard(creatorCardId).mechanics?.includes(GameTag[GameTag.MINIATURIZE]) &&
		cardCreationMechanics(creatorCardId, allCards).length === 1
	) {
		let tentativeMiniCard: ReferenceCard | null = null;
		if (allCards.getCard(creatorCardId).relatedCardDbfIds?.length === 1) {
			tentativeMiniCard = allCards.getCard(allCards.getCard(creatorCardId).relatedCardDbfIds![0]);
		}
		if (tentativeMiniCard?.mechanics?.includes(GameTag[GameTag.MINI])) {
			return tentativeMiniCard.id;
		}
		tentativeMiniCard = allCards.getCard(creatorCardId + 't');
		if (tentativeMiniCard?.mechanics?.includes(GameTag[GameTag.MINI])) {
			return tentativeMiniCard.id;
		}
	}
	if (
		createdIndex === 0 &&
		allCards.getCard(creatorCardId).mechanics?.includes(GameTag[GameTag.GIGANTIFY]) &&
		cardCreationMechanics(creatorCardId, allCards).length === 1
	) {
		let tentativeGiganticCard: ReferenceCard | null = null;
		if (allCards.getCard(creatorCardId).relatedCardDbfIds?.length === 1) {
			tentativeGiganticCard = allCards.getCard(allCards.getCard(creatorCardId).relatedCardDbfIds![0]);
		}
		if (tentativeGiganticCard?.mechanics?.includes(GameTag[GameTag.GIGANTIC])) {
			return tentativeGiganticCard.id;
		}
		tentativeGiganticCard = allCards.getCard(creatorCardId + 't');
		if (tentativeGiganticCard?.mechanics?.includes(GameTag[GameTag.GIGANTIC])) {
			return tentativeGiganticCard.id;
		}
	}
	return cardId;
};

export const denormalizeCreatorCardId = (
	creatorCardId: string,
	creatorEntityId: number,
	deck: DeckState,
): { creatorCardId: string; creatorEntityId: number } => {
	switch (creatorCardId) {
		case CardIds.SecretPassage_SecretEntranceEnchantment:
			return { creatorCardId: CardIds.SecretPassage, creatorEntityId };
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
				? { creatorCardId: card.creatorCardId!, creatorEntityId: card.creatorEntityId! }
				: { creatorCardId, creatorEntityId };
		default:
			return { creatorCardId, creatorEntityId };
	}
};

const cardCreationMechanics = (creatorCardId: string, allCards: CardsFacadeService): readonly GameTag[] => {
	const mechanics = [GameTag.MINIATURIZE, GameTag.GIGANTIFY, GameTag.DISCOVER];
	return allCards
		.getCard(creatorCardId)
		.mechanics?.filter((m) => mechanics.includes(GameTag[m]))
		.map((m) => GameTag[m]);
};
