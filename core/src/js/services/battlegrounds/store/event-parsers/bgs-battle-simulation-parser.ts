import { CardsFacadeService } from '@services/cards-facade.service';
import { BattlegroundsState } from '../../../../models/battlegrounds/battlegrounds-state';
import { BgsFaceOffWithSimulation } from '../../../../models/battlegrounds/bgs-face-off-with-simulation';
import { BgsGame } from '../../../../models/battlegrounds/bgs-game';
import { normalizeHeroCardId } from '../../bgs-utils';
import { BattlegroundsBattleSimulationEvent } from '../events/battlegrounds-battle-simulation-event';
import { BattlegroundsStoreEvent } from '../events/_battlegrounds-store-event';
import { EventParser } from './_event-parser';

export class BgsBattleSimulationParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	public applies(gameEvent: BattlegroundsStoreEvent, state: BattlegroundsState): boolean {
		return state && state.currentGame && gameEvent.type === 'BattlegroundsBattleSimulationEvent';
	}

	public async parse(
		currentState: BattlegroundsState,
		event: BattlegroundsBattleSimulationEvent,
	): Promise<BattlegroundsState> {
		if (!event.opponentHeroCardId || !normalizeHeroCardId(event.opponentHeroCardId, this.allCards)) {
			console.error('[bgs-battle-simulation] missing opponentCardId', event);
		}

		const gameAfterFaceOff: BgsGame = currentState.currentGame.updateLastFaceOff(
			normalizeHeroCardId(event.opponentHeroCardId, this.allCards),
			{
				battleResult: event.result,
				battleInfoStatus: 'done',
			} as BgsFaceOffWithSimulation,
		);
		return currentState.update({
			currentGame: gameAfterFaceOff,
		} as BattlegroundsState);
	}
}
