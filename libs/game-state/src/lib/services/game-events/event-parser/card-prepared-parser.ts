import { GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { addGuessInfoToCard } from '../../card-utils';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';
import { DeckManipulationHelper } from './deck-manipulation-helper';

export class CardPreparedParser implements EventParser {
	constructor(
		private readonly helper: DeckManipulationHelper,
		private readonly allCards: CardsFacadeService,
	) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		if (!entityId) {
			return currentState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const opponentDeck = isPlayer ? currentState.opponentDeck : currentState.playerDeck;

		const card = this.helper.findCardInZone(deck.hand, cardId, entityId);
		if (!card) {
			console.warn('[card-forged-parser] could not find card in hand', cardId, entityId, deck.hand?.length);
			return currentState;
		}

		const newCard = card.update({
			prepared: card.prepared + gameEvent.additionalData.prepareValue,
			tags: {
				...(card.tags ?? {}),
				[GameTag.PREPARED]: 1,
			},
		});

		console.debug('[card-prepared-parser] newCard', `entityId:${entityId}__`, newCard, gameEvent);
		const cardWithGuessedInfo = addGuessInfoToCard(
			newCard,
			null,
			null,
			deck,
			opponentDeck,
			currentState,
			this.allCards,
			{
				validArenaPool: [],
			},
		);
		const newHand = deck.hand.map((c) => (c.entityId === entityId ? cardWithGuessedInfo : c));
		const newDeck = deck.update({
			hand: newHand,
		});
		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newDeck,
		});
	}

	event(): string {
		return GameEvent.CARD_PREPARED;
	}
}
