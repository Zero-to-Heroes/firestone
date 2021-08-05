import { CardIds, Race, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { COUNTERSPELLS, globalEffectCards } from '../../hs-utils';
import { modifyDeckForSpecialCards } from './deck-contents-utils';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardPlayedFromHandParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly allCards: CardsFacadeService) {}

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
		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);
		console.debug('[card-played-from-hand] card in zone', card, deck.hand, cardId, entityId);

		const [newHand, removedCard] = this.helper.removeSingleCardFromZone(
			deck.hand,
			cardId,
			entityId,
			deck.deckList.length === 0 && !gameEvent.additionalData.transientCard,
		);
		console.debug('removed card from hand', removedCard, currentState, gameEvent);
		let newDeck =
			removedCard != null ? this.helper.updateDeckForAi(gameEvent, currentState, removedCard) : deck.deck;
		// console.debug('removed card from hand', removedCard, deck.deck, newDeck);
		// This happens when we create a card in the deck, then leave it there when the opponent draws it
		// (to avoid info leaks). When they play it we won't find it in the "hand" zone, so we try
		// and see if it is somewhere in the deck
		if (removedCard == null && cardId && !gameEvent.additionalData.transientCard) {
			const [newDeckAfterReveal, removedCardFromDeck] = this.helper.removeSingleCardFromZone(
				newDeck,
				cardId,
				entityId,
				deck.deckList.length === 0,
			);
			// console.debug('after removing from deck', newDeckAfterReveal, removedCardFromDeck, newDeck);
			if (removedCardFromDeck) {
				newDeck = newDeckAfterReveal;
			}
		}

		// Only minions end up on the board
		const refCard = this.allCards.getCard(cardId);
		const isOnBoard = refCard && refCard.type === 'Minion';
		const cardWithZone =
			card?.update({
				zone: isOnBoard ? 'PLAY' : null,
				manaCost: card.manaCost ?? refCard?.cost,
				rarity: card.rarity?.toLowerCase() ?? refCard?.rarity?.toLowerCase(),
				temporaryCard: false,
			} as DeckCard) ||
			DeckCard.create({
				entityId: entityId,
				cardId: cardId,
				cardName: refCard?.name,
				manaCost: refCard?.cost,
				rarity: refCard?.rarity?.toLowerCase(),
				zone: isOnBoard ? 'PLAY' : null,
				temporaryCard: false,
			} as DeckCard);

		const isCardCountered =
			((additionalInfo?.secretWillTrigger?.reactingToEntityId &&
				additionalInfo?.secretWillTrigger?.reactingToEntityId === entityId) ||
				(additionalInfo?.secretWillTrigger?.reactingToCardId &&
					additionalInfo?.secretWillTrigger?.reactingToCardId === cardId)) &&
			COUNTERSPELLS.includes(additionalInfo?.secretWillTrigger?.cardId);
		console.debug('is card countered', isCardCountered, additionalInfo, gameEvent);

		console.debug('card with zone', cardWithZone, refCard, cardId);
		const newBoard: readonly DeckCard[] =
			isOnBoard && !isCardCountered ? this.helper.addSingleCardToZone(deck.board, cardWithZone) : deck.board;
		console.debug('new board', newBoard, isOnBoard && !isCardCountered);
		const newOtherZone: readonly DeckCard[] = isOnBoard
			? deck.otherZone
			: this.helper.addSingleCardToZone(
					deck.otherZone,
					isCardCountered &&
						additionalInfo?.secretWillTrigger?.cardId === CardIds.Collectible.Paladin.OhMyYogg
						? // Since Yogg transforms the card
						  cardWithZone.update({
								entityId: undefined,
						  } as DeckCard)
						: cardWithZone,
			  );
		console.debug('new other', newOtherZone, isOnBoard);

		let newGlobalEffects: readonly DeckCard[] = deck.globalEffects;
		if (!isCardCountered && globalEffectCards.includes(card?.cardId)) {
			newGlobalEffects = this.helper.addSingleCardToZone(
				deck.globalEffects,
				cardWithZone?.update({
					// So that if the card is sent back to hand, we can track multiple plays of it
					entityId: null,
				} as DeckCard),
			);
		}

		const isElemental =
			refCard?.type === 'Minion' && refCard?.race?.toLowerCase() === Race[Race.ELEMENTAL].toLowerCase();

		const newPlayerDeck = Object.assign(new DeckState(), deck, {
			hand: newHand,
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
		// console.debug('is card countered?', isCardCountered, secretWillTrigger, cardId);
		const deckAfterSpecialCaseUpdate: DeckState = isCardCountered
			? newPlayerDeck
			: modifyDeckForSpecialCards(cardId, newPlayerDeck, this.allCards);
		// console.log('[secret-turn-end] updated deck', newPlayerDeck);
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: deckAfterSpecialCaseUpdate,
		});
	}

	private isWatchpost(refCard: ReferenceCard) {
		return refCard?.name?.includes('Watch Post');
	}

	private isLibram(refCard: ReferenceCard) {
		return refCard?.name?.startsWith('Libram');
	}

	event(): string {
		return GameEvent.CARD_PLAYED;
	}
}
