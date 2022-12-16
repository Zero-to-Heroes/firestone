import { Zone } from '@firestone-hs/reference-data';
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
		// console.debug('[card-stolen] stealing card', gameEvent, currentState);
		// Ideally ,this should just use the entity tags for the zone instead of
		// relying on finding the card somewhere
		const [cardId, , , entityId] = gameEvent.parse();

		const isPlayerStolenFrom = gameEvent.additionalData.newControllerId === gameEvent.opponentPlayer.PlayerId;
		const stolenFromDeck = isPlayerStolenFrom ? currentState.playerDeck : currentState.opponentDeck;
		// console.debug('[card-stolen] isPlayerStolenFrom', isPlayerStolenFrom, stolenFromDeck);

		const zone = gameEvent.additionalData.zone;
		const cardInHand =
			zone === Zone.HAND ? this.helper.findCardInZone(stolenFromDeck.hand, cardId, entityId) : null;
		// console.debug('[card-stolen] cardInHand', cardInHand);
		const cardInBoard =
			zone === Zone.PLAY ? this.helper.findCardInZone(stolenFromDeck.board, cardId, entityId) : null;
		// console.debug('[card-stolen] cardInBoard', cardInBoard);
		const cardInDeck =
			zone === Zone.DECK ? this.helper.findCardInZone(stolenFromDeck.deck, cardId, entityId) : null;
		// console.debug('[card-stolen] cardInDeck', cardInDeck);

		const secret = stolenFromDeck.secrets.find((entity) => entity.entityId === entityId);

		const [stolenHand, removedCardFromHand] = cardInHand
			? this.helper.removeSingleCardFromZone(stolenFromDeck.hand, cardId, entityId)
			: [stolenFromDeck.hand, undefined];
		// console.debug('[card-stolen] stolenHand', stolenHand, removedCardFromHand);

		const [stolenBoard] = cardInBoard
			? this.helper.removeSingleCardFromZone(stolenFromDeck.board, cardId, entityId)
			: [stolenFromDeck.board, undefined];
		// console.debug('[card-stolen] stolenBoard', stolenBoard);

		const [stolenDeck] = cardInDeck
			? this.helper.removeSingleCardFromZone(stolenFromDeck.deck, cardId, entityId)
			: [stolenFromDeck.deck, undefined];
		// console.debug('[card-stolen] stolenDeck', stolenDeck);

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
			// console.debug('[card-stolen] removedCard', result);
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
		const stealingHand =
			zone === Zone.HAND
				? this.helper.addSingleCardToZone(
						stealingToDeck.hand,
						cardInHand.update({
							cardId: cardInHand.cardId || cardId,
							cardName: this.i18n.getCardName(cardInHand.cardId) ?? this.i18n.getCardName(cardId),
							stolenFromOpponent: !cardInHand.stolenFromOpponent,
						} as DeckCard),
				  )
				: stealingToDeck.hand;

		const stealingBoard =
			zone === Zone.PLAY
				? this.helper.addSingleCardToZone(
						stealingToDeck.board,
						cardInBoard.update({
							cardId: cardInBoard.cardId || cardId,
							cardName: this.i18n.getCardName(cardInBoard.cardId) ?? this.i18n.getCardName(cardId),
							stolenFromOpponent: !cardInHand.stolenFromOpponent,
						} as DeckCard),
				  )
				: stealingToDeck.board;
		const stealingDeck =
			zone === Zone.DECK
				? this.helper.addSingleCardToZone(
						stealingToDeck.deck,
						cardInDeck.update({
							cardId: cardInDeck.cardId || cardId,
							cardName: this.i18n.getCardName(cardInDeck.cardId) ?? this.i18n.getCardName(cardId),
							stolenFromOpponent: !cardInHand.stolenFromOpponent,
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
