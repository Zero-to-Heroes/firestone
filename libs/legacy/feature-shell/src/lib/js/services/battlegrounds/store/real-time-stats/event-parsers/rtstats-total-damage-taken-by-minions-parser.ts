import { DamageGameEvent, GameEvent, RealTimeStatsState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { EventParser } from './_event-parser';

export class RTStatsTotalDamageTakenByMinionsParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.DAMAGE;
	}

	parse(
		gameEvent: DamageGameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const localPlayerId = gameEvent.localPlayer?.PlayerId;
		const targets = Object.values(gameEvent.additionalData.targets)
			.filter((target) => target.TargetControllerId === localPlayerId)
			.filter((target) => this.allCards.getCard(target.TargetCardId)?.type === 'Minion');
		if (!targets.length) {
			return currentState;
		}

		const damageTakenObj = currentState.totalMinionsDamageTaken;
		for (const target of targets) {
			const existingDamage = damageTakenObj[target.TargetCardId] ?? 0;
			damageTakenObj[target.TargetCardId] = existingDamage + target.Damage;
		}
		return currentState.update({
			totalMinionsDamageTaken: damageTakenObj,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsTotalDamageTakenByMinionsParser';
	}
}
