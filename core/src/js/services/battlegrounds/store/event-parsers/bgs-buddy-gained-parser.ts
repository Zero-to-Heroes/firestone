import { CardIds } from '@firestone-hs/reference-data';
import { BgsBuddyGainedEvent } from '@services/battlegrounds/store/events/bgs-buddy-gained-event';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { BgsPlayer } from '../../../../models/battlegrounds/bgs-player';
import { GameEvents } from '../../../game-events.service';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsBuddyGainedParser implements EventParser {
	constructor(private readonly gameEventsService: GameEvents) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsBuddyGainedEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsBuddyGainedEvent): Promise<BattlegroundsState> {
		const playerToUpdate = currentState.currentGame.players.find(
			(player) => normalizeHeroCardId(player.cardId) === normalizeHeroCardId(event.heroCardId),
		);
		if (!playerToUpdate) {
			if (event.heroCardId !== CardIds.KelthuzadBattlegrounds) {
				if (!currentState.reconnectOngoing && !this.gameEventsService.isCatchingUpLogLines()) {
					console.error(
						'No player found to update the buddy',
						currentState.currentGame.reviewId,
						event.heroCardId,
						normalizeHeroCardId(event.heroCardId),
						currentState.currentGame.players.map((player) => player.cardId),
					);
				}
			}
			return currentState;
		}
		const turn = currentState.currentGame.getCurrentTurnAdjustedForAsyncPlay();
		const newPlayer = playerToUpdate.update({
			buddyTurns: [...playerToUpdate.buddyTurns, turn],
		});
		const newPlayers: readonly BgsPlayer[] = currentState.currentGame.players.map((player) =>
			normalizeHeroCardId(player.cardId) === normalizeHeroCardId(newPlayer.cardId) ? newPlayer : player,
		);
		const newGame = currentState.currentGame.update({ players: newPlayers } as BgsGame);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
