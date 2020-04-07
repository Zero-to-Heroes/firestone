import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BgsLeaderboardPlaceEvent } from '../events/bgs-leaderboard-place-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsLeaderboardPlaceParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsLeaderboardPlaceEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsLeaderboardPlaceEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.players.find(player => player.cardId === event.heroCardId);
		if (!playerToUpdate) {
			return currentState;
		}
		const newPlayer = playerToUpdate.update({
			leaderboardPlace: event.leaderboardPlace,
		} as BgsPlayer);
		const newGame = currentState.currentGame.updatePlayer(newPlayer);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
