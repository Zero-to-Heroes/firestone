import { CardIds, LIBRAM_IDS, Race, ReferenceCard, WATCH_POST_IDS } from '@firestone-hs/reference-data';
import { DeckCard, GameState, ShortCard, ShortCardWithTurn } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../models/game-event';
import {
	COUNTERSPELLS,
	battlecryGlobalEffectCards,
	deathrattleGlobalEffectCards,
	globalEffectCards,
	hasRace,
	startOfGameGlobalEffectCards,
} from '../../hs-utils';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { modifyDecksForSpecialCards } from './deck-contents-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';
import { updateHandWithStonebrewInfo } from './special-cases/stonebrew/stonebrew';

export class CardPlayedFromHandParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(
		currentState: GameState,
		gameEvent: GameEvent,
		additionalInfo?: {
			secretWillTrigger?: {
				cardId: string;
				reactingToCardId: string;
				reactingToEntityId: number;
			};
			minionsWillDie?: readonly {
				cardId: string;
				entityId: number;
			}[];
		},
	): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		let opponentDeck = !isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		// It's important to not automatically populate the cardId here, as
		let card = this.helper.findCardInZone(deck.hand, cardId, entityId, true, false);

		// eslint-disable-next-line prefer-const
		let [newHand, removedCard] = this.helper.removeSingleCardFromZone(
			deck.hand,
			cardId,
			entityId,
			deck.deckList.length === 0 && !gameEvent.additionalData.transientCard,
		);
		// console.debug('[card-played] newHand', newHand, removedCard, card, deck.hand, deck);

		let newDeck = deck.deck;
		// 	removedCard != null ? this.helper.updateDeckForAi(gameEvent, currentState, removedCard) : deck.deck;

		// This happens when we create a card in the deck, then leave it there when the opponent draws it
		// (to avoid info leaks). When they play it we won't find it in the "hand" zone, so we try
		// and see if it is somewhere in the deck
		if (!removedCard?.cardId && cardId && !gameEvent.additionalData.transientCard) {
			// Technically this should also be done in "card-played-by-effect", but the use case is pretty marginal,
			// and not worth the added complexity for now
			if (removedCard?.stolenFromOpponent) {
				const [newDeckAfterReveal, removedCardFromDeck] = this.helper.removeSingleCardFromZone(
					opponentDeck.deck,
					cardId,
					entityId,
					false, // Only remove known cards
				);
				// console.debug(
				// 	'[card-played] newDeckAfterReveal otherDeck',
				// 	newDeckAfterReveal,
				// 	newDeck,
				// 	removedCardFromDeck,
				// );
				if (removedCardFromDeck) {
					removedCard = removedCardFromDeck;
					opponentDeck = opponentDeck.update({
						deck: newDeckAfterReveal,
					});
				}
			} else {
				const [newDeckAfterReveal, removedCardFromDeck] = this.helper.removeSingleCardFromZone(
					newDeck,
					cardId,
					entityId,
					false, // Only remove known cards
				);
				// console.debug('[card-played] newDeckAfterReveal', newDeckAfterReveal, newDeck, removedCardFromDeck);
				if (removedCardFromDeck) {
					removedCard = removedCardFromDeck;
					newDeck = newDeckAfterReveal;
				}
			}
		}

		const isCardCountered =
			((additionalInfo?.secretWillTrigger?.reactingToEntityId &&
				additionalInfo?.secretWillTrigger?.reactingToEntityId === entityId) ||
				(additionalInfo?.secretWillTrigger?.reactingToCardId &&
					additionalInfo?.secretWillTrigger?.reactingToCardId === cardId)) &&
			COUNTERSPELLS.includes(additionalInfo?.secretWillTrigger?.cardId as CardIds);

		// When it's the opponent, sometimes we miss some info like related card ids
		card = !!card?.cardId?.length ? card : removedCard;
		card = !!card.entityId ? card : card.update({ entityId: entityId });
		card = !!card.cardId ? card : card.update({ cardId: cardId });
		// console.debug('[card-played] card', card, removedCard);
		// Only minions end up on the board
		const refCard = this.allCards.getCard(card?.cardId ?? cardId);
		const isOnBoard = !isCardCountered && refCard && (refCard.type === 'Minion' || refCard.type === 'Location');
		const cardWithZone =
			card?.update({
				zone: isOnBoard ? 'PLAY' : null,
				manaCost: card.manaCost ?? refCard?.cost,
				rarity: card.rarity?.toLowerCase() ?? refCard?.rarity?.toLowerCase(),
				temporaryCard: false,
				playTiming: isOnBoard ? GameState.playTiming++ : null,
				countered: isCardCountered,
			} as DeckCard) ||
			DeckCard.create({
				entityId: entityId,
				cardId: cardId,
				cardName: this.i18n.getCardName(refCard?.id),
				manaCost: refCard?.cost,
				rarity: refCard?.rarity?.toLowerCase(),
				zone: isOnBoard ? 'PLAY' : null,
				temporaryCard: false,
				playTiming: isOnBoard ? GameState.playTiming++ : null,
				countered: isCardCountered,
			} as DeckCard);
		const cardWithInfo = cardWithZone.update({
			// When dealing with the opponent, the creator card id is hidden / removed when put in deck / drawn to
			// avoid info leaks, so if the info is present in the event, we add it
			creatorCardId: cardWithZone?.creatorCardId ?? gameEvent.additionalData.creatorCardId,
		});
		// console.debug('cardWithZone', cardWithZone, isCardCountered, additionalInfo);
		const cardToAdd =
			isCardCountered && additionalInfo?.secretWillTrigger?.cardId === CardIds.OhMyYogg
				? // Since Yogg transforms the card
				  cardWithInfo.update({
						entityId: undefined,
				  } as DeckCard)
				: cardWithInfo.update({
						relatedCardIds:
							// Reset the related card IDs once you play it, so that the info will be reset if you bounce it back to hand
							cardWithInfo.cardId === CardIds.CommanderSivara_TSC_087 ? [] : cardWithInfo.relatedCardIds,
				  });

		const newBoard: readonly DeckCard[] =
			isOnBoard && !isCardCountered ? this.helper.addSingleCardToZone(deck.board, cardToAdd) : deck.board;

		const newOtherZone: readonly DeckCard[] = isOnBoard
			? deck.otherZone
			: this.helper.addSingleCardToZone(deck.otherZone, cardToAdd);
		// console.debug('newOtherZone', newOtherZone);

		let newGlobalEffects: readonly DeckCard[] = deck.globalEffects;
		const hasBrann = deck.board.some((c) =>
			[CardIds.BrannBronzebeard_CORE_LOE_077, CardIds.BrannBronzebeard_LOE_077].includes(c.cardId as CardIds),
		);
		if (
			!isCardCountered &&
			globalEffectCards.includes(card?.cardId as CardIds) &&
			!startOfGameGlobalEffectCards.includes(card?.cardId as CardIds) &&
			!deathrattleGlobalEffectCards.includes(card?.cardId as CardIds)
		) {
			let numberOfGlobalEffectsToAdd = 1;
			if (battlecryGlobalEffectCards.includes(card?.cardId as CardIds) && hasBrann) {
				numberOfGlobalEffectsToAdd = 2;
			}
			// console.debug(
			// 	'numberOfGlobalEffects',
			// 	numberOfGlobalEffectsToAdd,
			// 	deck.board.map((c) => c.cardId),
			// );

			for (let i = 0; i < numberOfGlobalEffectsToAdd; i++) {
				newGlobalEffects = this.helper.addSingleCardToZone(
					newGlobalEffects,
					cardToAdd?.update({
						// So that if the card is sent back to hand, we can track multiple plays of it
						entityId: null,
					} as DeckCard),
				);
				// console.debug('added global effect', newGlobalEffects);
			}
		}

		const handAfterCardsRemembered = rememberCardsInHand(
			card.cardId,
			isCardCountered,
			newHand,
			this.helper,
			this.allCards,
		);
		// console.debug('[card-played] handAfterCardsRemembered', handAfterCardsRemembered, newHand);
		const handAfterCardsLinks = isCardCountered
			? handAfterCardsRemembered
			: processCardLinks(cardToAdd, handAfterCardsRemembered, this.helper, this.allCards);
		// console.debug('[card-played] handAfterCardsLinks', handAfterCardsLinks, cardToAdd);
		const hardAfterGuessedInfo = addGuessedInfo(cardWithInfo, handAfterCardsLinks, this.allCards);
		// console.debug('[card-played] hardAfterGuessedInfo', hardAfterGuessedInfo);

		const isElemental = refCard?.type === 'Minion' && hasRace(refCard, Race.ELEMENTAL);

		const newPlayerDeck = deck
			.update({
				hand: hardAfterGuessedInfo,
				board: newBoard,
				deck: newDeck,
				otherZone: newOtherZone,
				cardsPlayedThisTurn: isCardCountered
					? deck.cardsPlayedThisTurn
					: ([...deck.cardsPlayedThisTurn, cardToAdd] as readonly DeckCard[]),
				globalEffects: newGlobalEffects,
				// manaSpentOnSpellsThisMatch: manaSpentOnSpellsThisMatch,
				// manaSpentOnHolySpellsThisMatch: manaSpentOnHolySpellsThisMatch,
				watchpostsPlayedThisMatch:
					deck.watchpostsPlayedThisMatch + (!isCardCountered && this.isWatchpost(refCard) ? 1 : 0),
				libramsPlayedThisMatch:
					deck.libramsPlayedThisMatch + (!isCardCountered && this.isLibram(refCard) ? 1 : 0),
				chaoticTendrilsPlayedThisMatch:
					deck.chaoticTendrilsPlayedThisMatch +
					(hasBrann ? 2 : 1) * (!isCardCountered && refCard.id === CardIds.ChaoticTendril_YOG_514 ? 1 : 0),
				elementalsPlayedThisTurn: deck.elementalsPlayedThisTurn + (!isCardCountered && isElemental ? 1 : 0),
			})
			.updateSpellsPlayedThisMatch(
				isCardCountered ? null : cardToAdd,
				this.allCards,
				gameEvent.additionalData.cost,
			);
		// console.debug('newPlayerDeck', newPlayerDeck);

		const newCardPlayedThisMatch: ShortCardWithTurn = {
			entityId: cardToAdd.entityId,
			cardId: cardToAdd.cardId,
			side: isPlayer ? 'player' : 'opponent',
			turn: +currentState.currentTurn,
			effectiveCost: gameEvent.additionalData.cost,
		};
		const [playerDeckAfterSpecialCaseUpdate, opponentDeckAfterSpecialCaseUpdate] = modifyDecksForSpecialCards(
			cardToAdd.cardId,
			cardToAdd.entityId,
			isCardCountered,
			newPlayerDeck,
			opponentDeck,
			this.allCards,
			this.helper,
			this.i18n,
		);
		const finalPlayerDeck = playerDeckAfterSpecialCaseUpdate.update({
			cardsPlayedThisMatch: [
				...newPlayerDeck.cardsPlayedThisMatch,
				newCardPlayedThisMatch,
			] as readonly ShortCardWithTurn[],
			anachronosTurnsPlayed:
				cardId === CardIds.Anachronos
					? [...playerDeckAfterSpecialCaseUpdate.anachronosTurnsPlayed, currentState.gameTagTurnNumber]
					: playerDeckAfterSpecialCaseUpdate.anachronosTurnsPlayed,
		});
		// console.debug('deckAfterSpecialCaseUpdate', deckAfterSpecialCaseUpdate);

		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: finalPlayerDeck,
			[!isPlayer ? 'playerDeck' : 'opponentDeck']: opponentDeckAfterSpecialCaseUpdate,
			cardsPlayedThisMatch: isCardCountered
				? currentState.cardsPlayedThisMatch
				: ([...currentState.cardsPlayedThisMatch, newCardPlayedThisMatch] as readonly ShortCard[]),
		});
	}

	private isWatchpost(refCard: ReferenceCard) {
		return WATCH_POST_IDS.includes(refCard.id as CardIds);
	}

	private isLibram(refCard: ReferenceCard) {
		return LIBRAM_IDS.includes(refCard.id as CardIds);
	}

	event(): string {
		return GameEvent.CARD_PLAYED;
	}
}

export const rememberCardsInHand = (
	cardId: string,
	isCardCountered: boolean,
	hand: readonly DeckCard[],
	helper: DeckManipulationHelper,
	allCards: CardsFacadeService,
): readonly DeckCard[] => {
	let handAfterCardsRemembered = hand;
	if (!isCardCountered) {
		const refCard = allCards.getCard(cardId);
		if (refCard?.type === 'Spell') {
			const commanderSivaraCards = hand.filter((c) => c.cardId === CardIds.CommanderSivara_TSC_087);
			if (!!commanderSivaraCards.length) {
				const newSivaraCards = commanderSivaraCards.map((c) =>
					c.update({
						// Only keep the first 3
						relatedCardIds: [...c.relatedCardIds, cardId].slice(0, 3),
					}),
				);
				for (const newCard of newSivaraCards) {
					handAfterCardsRemembered = helper.replaceCardInZone(handAfterCardsRemembered, newCard);
				}
			}
		}
	}

	return handAfterCardsRemembered;
};

export const processCardLinks = (
	card: DeckCard,
	hand: readonly DeckCard[],
	helper: DeckManipulationHelper,
	allCards: CardsFacadeService,
): readonly DeckCard[] => {
	const linkedCardInHand = hand.find((c) => c.cardCopyLink === card.entityId);
	// console.debug('[card-played] processCardLinks', linkedCardInHand, card, hand);
	if (!linkedCardInHand) {
		return hand;
	}

	const updatedLinkedCardInHand = linkedCardInHand.update({
		cardId: card.cardId,
		cardName: card.cardName,
	});
	// console.debug('[card-played] processCardLinks updatedLinkedCardInHand', updatedLinkedCardInHand);
	const result = helper.updateCardInZone(
		hand,
		updatedLinkedCardInHand.entityId,
		updatedLinkedCardInHand.cardId,
		updatedLinkedCardInHand,
		false,
	);
	// console.debug('[card-played] processCardLinks result', result);
	return result;
};

const addGuessedInfo = (
	playedCard: DeckCard,
	hand: readonly DeckCard[],
	allCards: CardsFacadeService,
): readonly DeckCard[] => {
	switch (playedCard.creatorCardId) {
		case CardIds.HarthStonebrew_CORE_GIFT_01:
		case CardIds.HarthStonebrew_GIFT_01:
			return updateHandWithStonebrewInfo(playedCard, hand, allCards);
	}
	return hand;
};
