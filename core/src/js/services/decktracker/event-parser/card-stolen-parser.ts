import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { LocalizationFacadeService } from '../../localization-facade.service';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class CardStolenParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper, private readonly i18n: LocalizationFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return state && gameEvent.type === GameEvent.CARD_STOLEN;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		// Ideally ,this should just use the entity tags for the zone instead of
		// relying on finding the card somewhere
		const [cardId, , , entityId] = gameEvent.parse();

		const isPlayerStolenFrom = gameEvent.additionalData.newControllerId === gameEvent.opponentPlayer.PlayerId;

		const stolenFromDeck = isPlayerStolenFrom ? currentState.playerDeck : currentState.opponentDeck;

		const cardInHand = this.helper.findCardInZone(stolenFromDeck.hand, null, entityId);

		const cardInBoard = this.helper.findCardInZone(stolenFromDeck.board, null, entityId);

		const cardInDeck = this.helper.findCardInZone(stolenFromDeck.deck, null, entityId);

		const secret = stolenFromDeck.secrets.find((entity) => entity.entityId === entityId);

		const [stolenHand, removedCardFromHand] = cardInHand
			? this.helper.removeSingleCardFromZone(stolenFromDeck.hand, cardId, entityId)
			: [stolenFromDeck.hand, undefined];

		const [stolenBoard] = cardInBoard
			? this.helper.removeSingleCardFromZone(stolenFromDeck.board, cardId, entityId)
			: [stolenFromDeck.board, undefined];

		const [stolenDeck] = cardInDeck
			? this.helper.removeSingleCardFromZone(stolenFromDeck.deck, cardId, entityId)
			: [stolenFromDeck.deck, undefined];

		const stolenSecrets = stolenFromDeck.secrets.filter((entity) => entity.entityId !== entityId);

		// See card-played-from-hand
		let newDeck = stolenDeck;
		if (
			!isPlayerStolenFrom &&
			currentState.opponentDeck.deckList &&
			removedCardFromHand &&
			!removedCardFromHand.creatorCardId &&
			!removedCardFromHand.cardId
		) {
			const result = this.helper.removeSingleCardFromZone(stolenDeck, cardId, entityId);

			newDeck = result[0];
		}
		const newStolenDeck = Object.assign(new DeckState(), stolenFromDeck, {
			hand: stolenHand,
			board: stolenBoard,
			deck: newDeck,
			secrets: stolenSecrets,
		});

		// Here we just keep the card in the same zone, but in the other deck. Another event will
		// trigger afterwards to put the card in the right zone, if needed
		const stealingToDeck = isPlayerStolenFrom ? currentState.opponentDeck : currentState.playerDeck;
		const stealingHand = cardInHand
			? this.helper.addSingleCardToZone(
					stealingToDeck.hand,
					cardInHand.update({
						cardId: cardInHand.cardId || cardId,
						cardName: this.i18n.getCardName(cardInHand.cardId) ?? this.i18n.getCardName(cardId),
					} as DeckCard),
			  )
			: stealingToDeck.hand;

		const stealingBoard = cardInBoard
			? this.helper.addSingleCardToZone(
					stealingToDeck.board,
					cardInBoard.update({
						cardId: cardInBoard.cardId || cardId,
						cardName: this.i18n.getCardName(cardInBoard.cardId) ?? this.i18n.getCardName(cardId),
					} as DeckCard),
			  )
			: stealingToDeck.board;
		const stealingDeck = cardInDeck
			? this.helper.addSingleCardToZone(
					stealingToDeck.deck,
					cardInDeck.update({
						cardId: cardInDeck.cardId || cardId,
						cardName: this.i18n.getCardName(cardInDeck.cardId) ?? this.i18n.getCardName(cardId),
					} as DeckCard),
			  )
			: stealingToDeck.deck;

		const stealingSecrets = secret ? [...stealingToDeck.secrets, secret] : stealingToDeck.secrets;

		const newStealingDeck = Object.assign(new DeckState(), stealingToDeck, {
			hand: stealingHand,
			board: stealingBoard,
			deck: stealingDeck,
			secrets: stealingSecrets,
		});

		return Object.assign(new GameState(), currentState, {
			[isPlayerStolenFrom ? 'playerDeck' : 'opponentDeck']: newStolenDeck,
			[isPlayerStolenFrom ? 'opponentDeck' : 'playerDeck']: newStealingDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_STOLEN;
	}
}
