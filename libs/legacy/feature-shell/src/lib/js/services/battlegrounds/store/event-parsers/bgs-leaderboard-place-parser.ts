import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { BgsLeaderboardPlaceEvent } from '../events/bgs-leaderboard-place-event';
import { EventParser } from './_event-parser';

export class BgsLeaderboardPlaceParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsLeaderboardPlaceEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsLeaderboardPlaceEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.players.find((player) => player.playerId === event.playerId);

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

		const newGame = currentState.currentGame.updatePlayer(newPlayer, this.allCards);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
