import { BgsFaceOff } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/bgs-face-off';
import { RealTimeStatsState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameEvent } from '../../../../../../models/game-event';
import { isBattlegrounds, normalizeHeroCardId } from '../../../../bgs-utils';
import { EventParser } from './../_event-parser';

export class RTStatsBgsFaceOffParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return isBattlegrounds(currentState.gameType) && gameEvent.type === GameEvent.BATTLEGROUNDS_BATTLE_RESULT;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const result = gameEvent.additionalData.result;
		const currentWinStreak = result === 'won' ? currentState.currentWinStreak + 1 : 0;
		const highestWinStreak = Math.max(currentState.highestWinStreak, currentWinStreak);
		const newFaceOffs: readonly BgsFaceOff[] = [
			...(currentState.faceOffs || []),
			{
				turn: currentState.currentTurn,
				playerCardId: undefined,
				opponentCardId: normalizeHeroCardId(gameEvent.additionalData.opponent, this.allCards),
				opponentPlayerId: gameEvent.additionalData.opponentPlayerId,
				damage: gameEvent.additionalData.damage,
				result: result,
			} as BgsFaceOff,
		];
		// console.debug('[rtstats] faceoffs', newFaceOffs)
		return currentState.update({
			faceOffs: newFaceOffs,
			currentWinStreak: currentWinStreak,
			highestWinStreak: highestWinStreak,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsBgsFaceOffParser';
	}
}
