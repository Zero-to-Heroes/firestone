import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BgsLeaderboardPlaceEvent } from '../events/bgs-leaderboard-place-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsLeaderboardPlaceParser implements EventParser {
	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsLeaderboardPlaceEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsLeaderboardPlaceEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.players.find(
			(player) => normalizeHeroCardId(player.cardId) === normalizeHeroCardId(event.heroCardId),
		);
		// console.log('updating leaderboard place for', playerToUpdate, event, currentState);
		if (!playerToUpdate) {
			return currentState;
		}
		if (event.leaderboardPlace === 0) {
			console.error('invalid leaderboard place', event, currentState);
		}
		const newPlayer = playerToUpdate.update({
			displayedCardId: event.heroCardId,
			leaderboardPlace: event.leaderboardPlace,
		} as BgsPlayer);
		// console.log('newPlayer', newPlayer);
		const newGame = currentState.currentGame.updatePlayer(newPlayer);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
