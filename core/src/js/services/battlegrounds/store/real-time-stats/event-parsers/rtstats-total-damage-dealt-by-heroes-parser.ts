import { ComplexTurnInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/complex-turn-info';
import { ValueHeroInfo } from '@firestone-hs/hs-replay-xml-parser/dist/lib/model/value-hero-info';
import { CardIds } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { GameEvent } from '../../../../../models/game-event';
import { RealTimeStatsState } from '../real-time-stats';
import { EventParser } from './_event-parser';

export class RTStatsTotalDamageDealtByHeroesParser implements EventParser {
	constructor(private readonly allCards: AllCardsService) {}

	applies(gameEvent: GameEvent, currentState: RealTimeStatsState): boolean {
		return gameEvent.type === GameEvent.DAMAGE;
	}

	parse(
		gameEvent: GameEvent,
		currentState: RealTimeStatsState,
	): RealTimeStatsState | PromiseLike<RealTimeStatsState> {
		const localPlayerId = gameEvent.localPlayer.PlayerId;
		const damageSourceController = gameEvent.additionalData.sourceControllerId;
		if (localPlayerId !== damageSourceController) {
			return currentState;
		}

		const sourceCardId = gameEvent.additionalData.sourceCardId;
		const sourceCard = this.allCards.getCard(sourceCardId);
		if (!sourceCard?.id) {
			console.warn(this.name(), 'Could not find card', sourceCardId);
			return currentState;
		}

		if (sourceCard.type !== 'Hero') {
			return currentState;
		}

		const damageDealt = Object.values(gameEvent.additionalData.targets)
			.map((target: any) => target.Damage)
			.filter((target: any) => target.TargetCardId !== CardIds.NonCollectible.Neutral.KelthuzadTavernBrawl2)
			.reduce((sum, current) => sum + current, 0);
		const existingDamageForTurn =
			currentState.damageToEnemyHeroOverTurn.find(info => info.turn === currentState.currentTurn)?.value ?? 0;
		const newDamageForTurn = existingDamageForTurn + damageDealt;
		const newDamageOverTurn: readonly ComplexTurnInfo<ValueHeroInfo>[] = [
			...currentState.damageToEnemyHeroOverTurn.filter(info => info.turn !== currentState.currentTurn),
			{
				turn: currentState.currentTurn,
				value: newDamageForTurn,
			},
		];
		return currentState.update({
			damageToEnemyHeroOverTurn: newDamageOverTurn,
		} as RealTimeStatsState);
	}

	name(): string {
		return 'RTStatsTotalDamageDealtByHeroesParser';
	}
}
