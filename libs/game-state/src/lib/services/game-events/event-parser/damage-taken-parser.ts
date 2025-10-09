import { GameState } from '../../../models/game-state';
import { DamageGameEvent } from '../events/damage-game-event';
import { GameEvent } from '../game-event';
import { EventParser } from './_event-parser';

export class DamageTakenParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: DamageGameEvent): Promise<GameState> {
		const localPlayerCardId = currentState.playerDeck.hero?.cardId;
		const localPlayerId = gameEvent.localPlayer?.PlayerId;
		const damageForLocalPlayer = gameEvent.findTarget(localPlayerCardId!);
		// We check that the cardID is indeed our cardId, in case of mirror matches for instance
		const localPlayerDamage =
			damageForLocalPlayer && damageForLocalPlayer.TargetControllerId === localPlayerId
				? damageForLocalPlayer.Damage
				: 0;

		// So that we also handle the case where the player has switched to another hero
		const opponentPlayerCardId = currentState.opponentDeck.hero?.cardId;
		const opponentPlayerId = gameEvent.opponentPlayer?.PlayerId;
		const damageForOpponentPlayer = gameEvent.findTarget(opponentPlayerCardId!);
		const opponentPlayerDamage =
			damageForOpponentPlayer && damageForOpponentPlayer.TargetControllerId === opponentPlayerId
				? damageForOpponentPlayer.Damage
				: 0;

		if (damageForLocalPlayer?.IsPayingWithHealth || damageForOpponentPlayer?.IsPayingWithHealth) {
			return currentState;
		}

		let playerDamageByTurn = currentState.playerDeck.damageTakenOnYourTurns;
		if (currentState.playerDeck.isActivePlayer && localPlayerDamage > 0) {
			let playerDamageThisTurn = currentState.playerDeck.damageTakenOnYourTurns.find(
				(d) => d.turn === currentState.currentTurn,
			);
			if (!playerDamageThisTurn) {
				playerDamageThisTurn = { turn: +currentState.currentTurn, damage: [] };
				playerDamageByTurn = [...playerDamageByTurn, playerDamageThisTurn];
			}
			const newPlayerDamageThisTurn = {
				...playerDamageThisTurn,
				damage: [...playerDamageThisTurn.damage, localPlayerDamage],
			};
			playerDamageByTurn = playerDamageByTurn.map((d) =>
				d.turn === newPlayerDamageThisTurn.turn ? newPlayerDamageThisTurn : d,
			);
		}
		const playerDeck = currentState.playerDeck.update({
			damageTakenThisTurn: (currentState.playerDeck.damageTakenThisTurn ?? 0) + localPlayerDamage,
			damageTakenOnYourTurns: playerDamageByTurn,
		});

		let opponentDamageByTurn = currentState.opponentDeck.damageTakenOnYourTurns;
		if (currentState.opponentDeck.isActivePlayer && opponentPlayerDamage > 0) {
			let opponentDamageThisTurn = currentState.opponentDeck.damageTakenOnYourTurns.find(
				(d) => d.turn === currentState.currentTurn,
			);
			if (!opponentDamageThisTurn) {
				opponentDamageThisTurn = { turn: +currentState.currentTurn, damage: [] };
				opponentDamageByTurn = [...opponentDamageByTurn, opponentDamageThisTurn];
			}
			const newOpponentDamageThisTurn = {
				...opponentDamageThisTurn,
				damage: [...opponentDamageThisTurn.damage, opponentPlayerDamage],
			};
			opponentDamageByTurn = opponentDamageByTurn.map((d) =>
				d.turn === newOpponentDamageThisTurn.turn ? newOpponentDamageThisTurn : d,
			);
		}
		const opponentDeck = currentState.opponentDeck.update({
			damageTakenThisTurn: (currentState.opponentDeck.damageTakenThisTurn ?? 0) + opponentPlayerDamage,
			damageTakenOnYourTurns: opponentDamageByTurn,
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
