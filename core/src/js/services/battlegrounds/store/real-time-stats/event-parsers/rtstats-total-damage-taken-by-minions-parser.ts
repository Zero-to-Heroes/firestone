import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameEvent } from '../../../../../models/game-event';
import { RealTimeStatsState } from '../real-time-stats';
import { EventParser } from './_event-parser';

export class RTStatsTotalDamageTakenByMinionsParser implements EventParser {
	constructor(private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.DAMAGE;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const localPlayerId = gameEvent.localPlayer.PlayerId;
		const targets: readonly any[] = Object.values(gameEvent.additionalData.targets)
			.filter((target: any) => target.TargetControllerId === localPlayerId)
			.filter((target: any) => this.allCards.getCard(target.TargetCardId)?.type === 'Minion');
		if (!targets.length) {
			return currentState;
		}

		// console.debug('[bgs-real-time-stats] damage taken', 'targets', targets, gameEvent);
		const damageTakenObj = currentState.totalMinionsDamageTaken;
		// console.debug('[bgs-real-time-stats] damage taken', 'damageTakenObj', damageTakenObj);
		for (const target of targets) {
			const existingDamage = damageTakenObj[target.TargetCardId] ?? 0;
			// console.debug(
			// 	'[bgs-real-time-stats] damage taken',
			// 	'handling damage',
			// 	target,
			// 	existingDamage,
			// 	damageTakenObj[target.TargetCardId],
			// 	damageTakenObj,
			// );
			damageTakenObj[target.TargetCardId] = existingDamage + target.Damage;
		}
		// console.debug('[bgs-real-time-stats] damage taken', 'updated damageTakenObj', damageTakenObj);
		return currentState.update({
			totalMinionsDamageTaken: damageTakenObj,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsTotalDamageTakenByMinionsParser';
	}
}
