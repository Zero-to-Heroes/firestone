import { GameType } from '@firestone-hs/reference-data';
import { GameEvent } from '../../../../../../models/game-event';
import { defaultStartingHp } from '../../../../../hs-utils';
import { normalizeHeroCardId } from '../../../../bgs-utils';
import { RealTimeStatsState } from '../../real-time-stats';
import { EventParser } from '../_event-parser';

export class RTStatsBgsHeroSelectedParser implements EventParser {
	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return (
			[GameType.GT_BATTLEGROUNDS, GameType.GT_BATTLEGROUNDS_FRIENDLY].includes(currentState.gameType) &&
			gameEvent.type === GameEvent.BATTLEGROUNDS_HERO_SELECTED
		);
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		// still not working
		const heroCardId = normalizeHeroCardId(gameEvent.cardId);
		const hpOverTurn = currentState.hpOverTurn;
		hpOverTurn[heroCardId] = [
			{
				turn: 0,
				value: defaultStartingHp(currentState.gameType, heroCardId),
			},
		];
		return currentState.update({
			hpOverTurn: hpOverTurn,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsBgsHeroSelectedParser';
	}
}
