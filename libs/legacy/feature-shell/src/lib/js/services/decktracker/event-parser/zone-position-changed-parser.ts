import { Zone } from '@firestone-hs/reference-data';
import { DeckCard, GameState } from '@firestone/game-state';
import { GameEvent } from '../../../models/game-event';
import { DeckManipulationHelper } from './deck-manipulation-helper';
import { EventParser } from './event-parser';

export class ZonePositionChangedParser implements EventParser {
	constructor(private readonly helper: DeckManipulationHelper) {}

	// Whenever something occurs that publicly reveal a card, we try to assign its
	// cardId to the corresponding entity
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;

		const zoneUpdate = gameEvent.additionalData.zoneUpdates[0];
		const newHand =
			zoneUpdate.Zone === Zone.HAND ? updateZone(deck.hand, entityId, zoneUpdate.NewPosition) : deck.hand;
		const newBoard =
			zoneUpdate.Zone === Zone.PLAY ? updateZone(deck.board, entityId, zoneUpdate.NewPosition) : deck.board;
		console.debug(
			'[debug] ZonePositionChangedParser.parse',
			Zone[zoneUpdate.Zone],
			entityId,
			zoneUpdate.NewPosition,
			newHand,
			deck.hand,
			newBoard,
			deck.board,
		);
		if (newHand === deck.hand && newBoard === deck.board) {
			return currentState;
		}

		const newPlayerDeck = deck.update({
			hand: newHand,
			board: newBoard,
		});

		return Object.assign(new GameState(), currentState, {
			[isPlayer ? 'playerDeck' : 'opponentDeck']: newPlayerDeck,
		});
	}

	event(): string {
		return GameEvent.ZONE_POSITION_CHANGED;
	}
}

const updateZone = (zone: readonly DeckCard[], entityId: number, newPosition: number): readonly DeckCard[] => {
	const card = zone.find((card) => card.entityId === entityId);
	if (!card) {
		return zone;
	}

	const newZone = zone.filter((card) => card.entityId !== entityId);
	newZone.splice(newPosition, 0, card);
	return newZone;
};
