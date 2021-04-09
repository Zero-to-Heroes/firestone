import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameEvent } from '../../../../../models/game-event';
import { DamageGameEvent } from '../../../../../models/mainwindow/game-events/damage-game-event';
import { RealTimeStatsState } from '../real-time-stats';
import { EventParser } from './_event-parser';

export class RTStatsTotalDamageDealtByMinionsParser implements EventParser {
	constructor(private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.DAMAGE;
	}

	parse(
		gameEvent: DamageGameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const localPlayerId = gameEvent.localPlayer?.PlayerId;
		const damageSourceController = gameEvent.additionalData?.sourceControllerId;
		if (localPlayerId && localPlayerId !== damageSourceController) {
			return currentState;
		}

		const sourceCardId = gameEvent.additionalData.sourceCardId;
		const sourceCard = this.allCards.getCard(sourceCardId);
		if (!sourceCard?.id) {
			console.warn(this.name(), 'Could not find card', sourceCardId);
			return currentState;
		}

		if (sourceCard.type !== 'Minion') {
			return currentState;
		}

		const damageDealt = Object.values(gameEvent.additionalData.targets)
			.map(target => target.Damage)
			.reduce((sum, current) => sum + current, 0);
		const existingDamageForMinion = currentState.totalMinionsDamageDealt[sourceCardId] ?? 0;
		const newTotalMinionsDamageDealt = {
			...currentState.totalMinionsDamageDealt,
			[sourceCardId]: existingDamageForMinion + damageDealt,
		};
		return currentState.update({
			totalMinionsDamageDealt: newTotalMinionsDamageDealt,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsTotalDamageDealtByMinionsParser';
	}
}
