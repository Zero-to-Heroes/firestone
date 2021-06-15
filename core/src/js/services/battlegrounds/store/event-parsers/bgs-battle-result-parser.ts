import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsFaceOffWithSimulation } from '../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { Events } from '../../../events.service';
import { GameEvents } from '../../../game-events.service';
import { OverwolfService } from '../../../overwolf.service';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BgsBattleResultEvent } from '../events/bgs-battle-result-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsBattleResultParser implements EventParser {
	constructor(
		private readonly events: Events,
		private readonly ow: OverwolfService,
		private readonly gameEventsService: GameEvents,
	) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BgsBattleResultEvent';
	}

	public async parse(currentState: BattlegroundsState, event: BgsBattleResultEvent): Promise<BattlegroundsState> {
		if (!currentState.currentGame.getMainPlayer()) {
			if (!currentState.reconnectOngoing && !this.gameEventsService.isCatchingUpLogLines()) {
				console.error(
					'[bgs-simulation] Could not find main player in battle result parser',
					currentState.currentGame.players.map((player) => player.cardId),
				);
			}
			return currentState;
		}
		const gameAfterFirstFaceOff: BgsGame = currentState.currentGame.updateLastFaceOff(
			normalizeHeroCardId(event.opponentCardId),
			{
				result: event.result,
				damage: event.damage,
			} as BgsFaceOffWithSimulation,
		);
		const newGame = gameAfterFirstFaceOff.update({
			lastOpponentCardId: event.opponentCardId,
		} as BgsGame);
		this.events.broadcast(Events.BATTLE_SIMULATION_HISTORY_UPDATED, newGame);
		console.log('[bgs-simulation] updating with result and resetting battle info', event);
		return currentState.update({
			currentGame: newGame,
		} as BattlegroundsState);
	}
}
