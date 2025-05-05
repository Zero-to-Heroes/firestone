import { GameTag, Zone } from '@firestone-hs/reference-data';
import { DeckCard, DeckState, GameState } from '@firestone/game-state';
import { Mutable } from '@firestone/shared/framework/common';
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
		const playerDeck = currentState.playerDeck;
		const opponentDeck = currentState.opponentDeck;
		let playerHandDirty = false;
		let opponentHandDirty = false;
		let playerBoardDirty = false;
		let opponentBoardDirty = false;

		for (const zoneUpdate of zoneUpdates) {
			const controllerId = zoneUpdate.ControllerId;
			const entityId = zoneUpdate.EntityId;
			const isPlayer = controllerId === localPlayer.PlayerId;
			const deck = isPlayer ? playerDeck : opponentDeck;
			const newHand =
				zoneUpdate.Zone === Zone.HAND
					? updateZoneUnsafe(deck.hand, entityId, zoneUpdate.NewPosition)
					: deck.hand;
			const newBoard =
				zoneUpdate.Zone === Zone.PLAY
					? updateZoneUnsafe(deck.board, entityId, zoneUpdate.NewPosition)
					: deck.board;
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
			if (zoneUpdate.Zone === Zone.HAND && isPlayer) {
				playerHandDirty = true;
			}
			if (zoneUpdate.Zone === Zone.HAND && !isPlayer) {
				opponentHandDirty = true;
			}
			if (zoneUpdate.Zone === Zone.PLAY && isPlayer) {
				playerBoardDirty = true;
			}
			if (zoneUpdate.Zone === Zone.PLAY && !isPlayer) {
				opponentBoardDirty = true;
			}
			// Modify in place
			if (isPlayer) {
				(playerDeck as Mutable<DeckState>).hand = newHand;
				(playerDeck as Mutable<DeckState>).board = newBoard;
			}
			if (!isPlayer) {
				(opponentDeck as Mutable<DeckState>).hand = newHand;
				(opponentDeck as Mutable<DeckState>).board = newBoard;
			}
		}

		return currentState.update({
			playerDeck:
				playerHandDirty || playerBoardDirty
					? playerDeck.update({
							hand: playerDeck.hand,
							board: playerDeck.board,
					  })
					: playerDeck,
			opponentDeck:
				opponentBoardDirty || opponentHandDirty
					? opponentDeck.update({
							hand: opponentDeck.hand,
							board: opponentDeck.board,
					  })
					: opponentDeck,
		});
	}

	event(): string {
		return GameEvent.ZONE_POSITION_CHANGED;
	}
}

const updateZoneUnsafe = (zone: readonly DeckCard[], entityId: number, newPosition: number): readonly DeckCard[] => {
	const card = zone.find((card) => card.entityId === entityId);
	if (!card) {
		return zone;
	}

	// Modify in place
	card.tags[GameTag.ZONE_POSITION] = newPosition;
	return zone;
};
