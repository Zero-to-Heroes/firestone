import { GameTag, Zone } from '@firestone-hs/reference-data';
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
		const [, , localPlayer] = gameEvent.parse();

		const zoneUpdates = gameEvent.additionalData.zoneUpdates;
		let playerDeck = currentState.playerDeck;
		let opponentDeck = currentState.opponentDeck;
		for (const zoneUpdate of zoneUpdates) {
			const controllerId = zoneUpdate.ControllerId;
			const entityId = zoneUpdate.EntityId;
			const isPlayer = controllerId === localPlayer.PlayerId;
			const deck = isPlayer ? playerDeck : opponentDeck;
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
				continue;
			}
			playerDeck = isPlayer
				? playerDeck.update({
						hand: newHand,
						board: newBoard,
				  })
				: playerDeck;
			opponentDeck = isPlayer
				? opponentDeck
				: opponentDeck.update({
						hand: newHand,
						board: newBoard,
				  });
		}

		if (playerDeck === currentState.playerDeck && opponentDeck === currentState.opponentDeck) {
			return currentState;
		}

		return currentState.update({
			playerDeck: playerDeck,
			opponentDeck: opponentDeck,
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

	const newZone = zone.map((c) =>
		c.entityId === entityId ? c.update({ tags: { ...c.tags, [GameTag.ZONE_POSITION]: newPosition } }) : c,
	);
	return newZone;
};
