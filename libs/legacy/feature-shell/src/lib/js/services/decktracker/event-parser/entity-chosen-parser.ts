import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { GameState } from '../../../models/decktracker/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

const CARDS_THAT_PUT_ON_TOP = [
	CardIds.SightlessWatcher,
	CardIds.SightlessWatcherLegacy,
	CardIds.FindTheImposter_SpyOMaticToken,
	CardIds.DraconicHerald,
	CardIds.TimewayWanderer,
];

export class EntityChosenParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const newState = this.handleEvent(currentState, gameEvent);
		return newState.update({
			playerDeck: newState.playerDeck.update({
				currentOptions: [],
			}),
			opponentDeck: newState.opponentDeck.update({
				currentOptions: [],
			}),
		});
	}

	private handleEvent(currentState: GameState, gameEvent: GameEvent): GameState {
		const originCreatorCardId = gameEvent.additionalData?.context?.creatorCardId;
		if (CARDS_THAT_PUT_ON_TOP.includes(originCreatorCardId)) {
			return this.handleCardOnTop(currentState, gameEvent);
		} else if (originCreatorCardId === CardIds.NellieTheGreatThresher) {
			// console.debug('handling nellie pirate crew');
			return this.handleNelliePirateCrew(currentState, gameEvent);
		}
		return currentState;
	}

	private handleNelliePirateCrew(currentState: GameState, gameEvent: GameEvent): GameState {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		// console.debug('deck', deck, isPlayer);
		// TODO: probably won't work if there are two pirates ships on the board at the same time
		const pirateShipEntity = this.helper.findCardInZone(
			deck.board,
			CardIds.NellieTheGreatThresher_NelliesPirateShipToken,
			null,
		);
		// console.debug('pirateShipEntity', pirateShipEntity);
		const updatedShip = pirateShipEntity.update({
			relatedCardIds: [...pirateShipEntity.relatedCardIds, cardId],
		});
		// console.debug('updatedShip', updatedShip);
		const updatedBoard = this.helper.empiricReplaceCardInZone(deck.board, updatedShip, false);
		// console.debug('updatedBoard', updatedBoard);
		const newPlayerDeck = deck.update({
			board: updatedBoard,
		});
		// console.debug('newPlayerDeck', newPlayerDeck);
		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	private handleCardOnTop(currentState: GameState, gameEvent: GameEvent): GameState {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer =
			gameEvent.additionalData?.context?.creatorCardId === CardIds.FindTheImposter_SpyOMaticToken
				? controllerId !== localPlayer.PlayerId
				: controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const cardInDeck = this.helper.findCardInZone(deck.deck, cardId, gameEvent.additionalData?.originalEntityId);
		if (!cardInDeck) {
			// console.debug(
			// 	'[entity-chosen] card not found in deck',
			// 	cardId,
			// 	gameEvent.additionalData?.originalEntityId,
			// 	deck.deck,
			// );
			return currentState;
		}

		const newCard = cardInDeck.update({
			positionFromTop: 0,
		});

		const newDeck: readonly DeckCard[] = this.helper.empiricReplaceCardInZone(
			deck.deck,
			newCard,
			deck.deckList.length === 0,
		);

		const newPlayerDeck = deck.update({
			deck: newDeck,
		});

		return currentState.update({
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.ENTITY_CHOSEN;
	}
}
