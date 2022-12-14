import { CardIds, LIBRAM_IDS, Race, ReferenceCard, WATCH_POST_IDS } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState, ShortCard } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { COUNTERSPELLS, globalEffectCards, startOfGameGlobalEffectCards } from '../../hs-utils';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { modifyDecksForSpecialCards } from './deck-contents-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardPlayedFromHandParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_PLAYED;
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
		const opponentDeck = !isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);

		const [newHand, removedCard] = this.helper.removeSingleCardFromZone(
			deck.hand,
			cardId,
			entityId,
			deck.deckList.length === 0 && !gameEvent.additionalData.transientCard,
		);
		// console.debug('[card-played] newHand', newHand, removedCard);

		let newDeck = deck.deck;
		// 	removedCard != null ? this.helper.updateDeckForAi(gameEvent, currentState, removedCard) : deck.deck;

		// This happens when we create a card in the deck, then leave it there when the opponent draws it
		// (to avoid info leaks). When they play it we won't find it in the "hand" zone, so we try
		// and see if it is somewhere in the deck
		if (!removedCard?.cardId && cardId && !gameEvent.additionalData.transientCard) {
			const [newDeckAfterReveal, removedCardFromDeck] = this.helper.removeSingleCardFromZone(
				newDeck,
				cardId,
				entityId,
				false, // Only remove known cards
			);
			// console.debug('[card-played] newDeckAfterReveal', newDeckAfterReveal, newDeck, removedCardFromDeck);

			if (removedCardFromDeck) {
				newDeck = newDeckAfterReveal;
			}
		}

		const isCardCountered =
			((additionalInfo?.secretWillTrigger?.reactingToEntityId &&
				additionalInfo?.secretWillTrigger?.reactingToEntityId === entityId) ||
				(additionalInfo?.secretWillTrigger?.reactingToCardId &&
					additionalInfo?.secretWillTrigger?.reactingToCardId === cardId)) &&
			COUNTERSPELLS.includes(additionalInfo?.secretWillTrigger?.cardId as CardIds);

		// Only minions end up on the board
		const refCard = this.allCards.getCard(cardId);
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
		// console.debug('cardWithZone', cardWithZone, isCardCountered, additionalInfo);

		const newBoard: readonly DeckCard[] =
			isOnBoard && !isCardCountered ? this.helper.addSingleCardToZone(deck.board, cardWithZone) : deck.board;

		const newOtherZone: readonly DeckCard[] = isOnBoard
			? deck.otherZone
			: this.helper.addSingleCardToZone(
					deck.otherZone,
					isCardCountered && additionalInfo?.secretWillTrigger?.cardId === CardIds.OhMyYogg
						? // Since Yogg transforms the card
						  cardWithZone.update({
								entityId: undefined,
						  } as DeckCard)
						: cardWithZone,
			  );
		// console.debug('newOtherZone', newOtherZone);

		let newGlobalEffects: readonly DeckCard[] = deck.globalEffects;
		if (
			!isCardCountered &&
			globalEffectCards.includes(card?.cardId as CardIds) &&
			!startOfGameGlobalEffectCards.includes(card?.cardId as CardIds)
		) {
			newGlobalEffects = this.helper.addSingleCardToZone(
				deck.globalEffects,
				cardWithZone?.update({
					// So that if the card is sent back to hand, we can track multiple plays of it
					entityId: null,
				} as DeckCard),
			);
		}

		const handAfterCardsRemembered = isCardCountered
			? newHand
			: rememberCardsInHand(cardId, newHand, this.helper, this.allCards);

		const isElemental = refCard?.type === 'Minion' && refCard?.races?.includes(Race[Race.ELEMENTAL]);

		const newPlayerDeck = deck.update({
			hand: handAfterCardsRemembered,
			board: newBoard,
			deck: newDeck,
			otherZone: newOtherZone,
			cardsPlayedThisTurn: isCardCountered
				? deck.cardsPlayedThisTurn
				: ([...deck.cardsPlayedThisTurn, cardWithZone] as readonly DeckCard[]),
			globalEffects: newGlobalEffects,
			spellsPlayedThisMatch:
				!isCardCountered && refCard?.type === 'Spell'
					? [...deck.spellsPlayedThisMatch, cardWithZone]
					: deck.spellsPlayedThisMatch,
			watchpostsPlayedThisMatch:
				deck.watchpostsPlayedThisMatch + (!isCardCountered && this.isWatchpost(refCard) ? 1 : 0),
			libramsPlayedThisMatch: deck.libramsPlayedThisMatch + (!isCardCountered && this.isLibram(refCard) ? 1 : 0),
			elementalsPlayedThisTurn: deck.elementalsPlayedThisTurn + (!isCardCountered && isElemental ? 1 : 0),
		} as DeckState);
		// console.debug('newPlayerDeck', newPlayerDeck);

		const newCardPlayedThisMatch: ShortCard = {
			entityId: cardWithZone.entityId,
			cardId: cardWithZone.cardId,
			side: isPlayer ? 'player' : 'opponent',
		};
		const [playerDeckAfterSpecialCaseUpdate, opponentDeckAfterSpecialCaseUpdate] = isCardCountered
			? [newPlayerDeck, opponentDeck]
			: modifyDecksForSpecialCards(cardId, newPlayerDeck, opponentDeck, this.allCards, this.i18n);
		const finalPlayerDeck = playerDeckAfterSpecialCaseUpdate.update({
			cardsPlayedThisMatch: [
				...newPlayerDeck.cardsPlayedThisMatch,
				newCardPlayedThisMatch,
			] as readonly ShortCard[],
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
	hand: readonly DeckCard[],
	helper: DeckManipulationHelper,
	allCards: CardsFacadeService,
): readonly DeckCard[] => {
	const commanderSivaraCards = hand.filter((c) => c.cardId === CardIds.CommanderSivara_TSC_087);
	const refCard = allCards.getCard(cardId);
	let handAfterCardsRemembered = hand;
	if (refCard?.type === 'Spell' && !!commanderSivaraCards.length) {
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
	return handAfterCardsRemembered;
};
