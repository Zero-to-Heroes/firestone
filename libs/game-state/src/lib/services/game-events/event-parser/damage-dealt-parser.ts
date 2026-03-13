import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DamageDealt } from '../../../models/deck-state';
import { GameState } from '../../../models/game-state';
import { DamageGameEvent } from '../events/damage-game-event';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';

export class DamageDealtParser implements EventParser {
	constructor(private readonly allCards: CardsFacadeService) {}

	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: DamageGameEvent): Promise<GameState> {
		const localPlayerId = gameEvent.localPlayer?.PlayerId;
		const opponentPlayerId = gameEvent.opponentPlayer?.PlayerId;

		const targets = Object.values(gameEvent.additionalData.targets);

		const localPlayerDamageDealt: readonly DamageDealt[] = targets
			.filter((target) => target.SourceControllerId === localPlayerId)
			.filter((target) => !target.IsPayingWithHealth)
			.filter((target) => target.Damage > 0)
			.map((target) => ({
				sourceCardId: target.SourceCardId ?? gameEvent.additionalData.sourceCardId,
				sourceEntityId: target.SourceEntityId ?? gameEvent.additionalData.sourceEntityId,
				sourceControllerId: target.SourceControllerId,
				targetCardId: target.TargetCardId,
				targetEntityId: target.TargetEntityId,
				targetControllerId: target.TargetControllerId,
				damage: target.Damage,
			}));

		const opponentPlayerDamageDealt: readonly DamageDealt[] = targets
			.filter((target) => target.SourceControllerId === opponentPlayerId)
			.filter((target) => !target.IsPayingWithHealth)
			.filter((target) => target.Damage > 0)
			.map((target) => ({
				sourceCardId: target.SourceCardId ?? gameEvent.additionalData.sourceCardId,
				sourceEntityId: target.SourceEntityId ?? gameEvent.additionalData.sourceEntityId,
				sourceControllerId: target.SourceControllerId,
				targetCardId: target.TargetCardId,
				targetEntityId: target.TargetEntityId,
				targetControllerId: target.TargetControllerId,
				damage: target.Damage,
			}));

		const playerDeck = currentState.playerDeck.update({
			damageDealtThisTurn: [
				...currentState.playerDeck.damageDealtThisTurn,
				...localPlayerDamageDealt,
			],
		});
		const opponentDeck = currentState.opponentDeck.update({
			damageDealtThisTurn: [
				...currentState.opponentDeck.damageDealtThisTurn,
				...opponentPlayerDamageDealt,
			],
		});

		return Object.assign(new GameState(), currentState, {
			playerDeck: playerDeck,
			opponentDeck: opponentDeck,
		} as GameState);
	}

	event(): string {
		return GameEvent.DAMAGE;
	}
}
