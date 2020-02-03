import { BattlegroundsPlayer } from '../../../models/battlegrounds/battlegrounds-player';
import { BattlegroundsState } from '../../../models/battlegrounds/battlegrounds-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class BattlegroundsLeaderboardPlaceParser implements EventParser {
	public applies(gameEvent: GameEvent, state: BattlegroundsState): boolean {
		return state && gameEvent.type === GameEvent.BATTLEGROUNDS_LEADERBOARD_PLACE;
	}

	public async parse(currentState: BattlegroundsState, gameEvent: GameEvent): Promise<BattlegroundsState> {
		const cardId = gameEvent.additionalData.cardId;
		const newLeaderboardPlace = gameEvent.additionalData.leaderboardPlace;
		const player: BattlegroundsPlayer = currentState.getPlayer(cardId);
		const newPlayer = player.update({ leaderboardPlace: newLeaderboardPlace } as BattlegroundsPlayer);
		return currentState.updatePlayer(newPlayer);
	}

	public event() {
		return GameEvent.BATTLEGROUNDS_LEADERBOARD_PLACE;
	}
}
