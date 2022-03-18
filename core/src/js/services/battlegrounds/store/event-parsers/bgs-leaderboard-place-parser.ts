import { CardsFacadeService } from '@services/cards-facade.service';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BgsLeaderboardPlaceEvent } from '../events/bgs-leaderboard-place-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsLeaderboardPlaceParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsLeaderboardPlaceEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsLeaderboardPlaceEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.players.find(
			(player) =>
				normalizeHeroCardId(player.cardId, this.allCards) ===
				normalizeHeroCardId(event.heroCardId, this.allCards),
		);

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
