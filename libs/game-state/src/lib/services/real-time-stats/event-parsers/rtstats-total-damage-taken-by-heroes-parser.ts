import { CardsFacadeService } from '@firestone/shared/framework/core';
import { RealTimeStatsState } from '../../../models/_barrel';
import { DamageGameEvent } from '../../game-events/events/damage-game-event';
import { GameEvent } from '../../game-events/game-event';
import { EventParser } from './_event-parser';

/** @deprecated */
export class RTStatsTotalDamageTakenByHeroesParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return false;
		return gameEvent.type === GameEvent.DAMAGE;
	}

	// Will be used sometimes for constructed maybe?
	parse(
		gameEvent: DamageGameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		return currentState;
		// const localPlayerId = gameEvent.localPlayer.PlayerId;
		// const damageTaken = Object.values(gameEvent.additionalData.targets)
		// 	.filter((target: any) => target.TargetControllerId === localPlayerId)
		// 	.filter((target: any) => this.allCards.getCard(target.TargetCardId)?.type === 'Hero')
		// 	.map((target: any) => target.Damage)
		// 	.reduce((sum, current) => sum + current, 0);
		// return currentState.update({
		// 	totalDamageTakenByMainHero: currentState.totalDamageTakenByMainHero + damageTaken,
		// } as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsTotalDamageTakenByHeroesParser';
	}
}
