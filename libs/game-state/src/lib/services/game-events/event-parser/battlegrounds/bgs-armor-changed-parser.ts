import { isBattlegrounds } from '@firestone-hs/reference-data';
import { BgsPlayer } from '../../../../models/_barrel';
import { GameState } from '../../../../models/game-state';
import { GameEvent } from '../../game-event';
import { EventParser } from '../_event-parser';

export class BgsArmorChangedParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state && isBattlegrounds(state.metadata?.gameType);
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const cardId = gameEvent.additionalData.cardId;
		const playerId = gameEvent.additionalData.playerId;
		const totalArmor = gameEvent.additionalData.totalArmor;

		const playerToUpdate = currentState.bgState.currentGame?.findPlayer(playerId);
		if (!playerToUpdate) {
			return currentState;
		}

		const newPlayer: BgsPlayer = playerToUpdate.update({
			currentArmor: totalArmor,
		});

		const newGame = currentState.bgState.currentGame!.updatePlayer(newPlayer);
		return currentState.update({
			bgState: currentState.bgState.update({
				currentGame: newGame,
			}),
		});
	}

	event(): string {
		return GameEvent.ARMOR_CHANGED;
	}
}
