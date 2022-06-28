import { buildLuckFactor } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { BgsGame } from '../../../../../../models/battlegrounds/bgs-game';
import { GameEvent } from '../../../../../../models/game-event';
import { Events } from '../../../../../events.service';
import { isBattlegrounds } from '../../../../bgs-utils';
import { RealTimeStatsState } from '../../real-time-stats';
import { EventParser } from '../_event-parser';

export class RTStatsBgsBattleHistoryUpdatedParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return isBattlegrounds(currentState.gameType) && gameEvent.type === Events.BATTLE_SIMULATION_HISTORY_UPDATED;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const history = (gameEvent.additionalData.game as BgsGame).buildBattleResultHistory();
		const luckFactor = buildLuckFactor(history) ?? 0;
		return currentState.update({
			luckFactor: luckFactor,
			battleResultHistory: history,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsBgsBattleHistoryUpdatedParser';
	}
}
