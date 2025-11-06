import { GameState } from '@firestone/game-state';
import { GameEvent } from '../../../models/game-event';
import { EventParser } from './event-parser';

export class ArmorChangedParser implements EventParser {
	applies(gameEvent: GameEvent, state: GameState): boolean {
		return !!state;
	}

	async parse(currentState: GameState, gameEvent: GameEvent): Promise<GameState> {
		const [cardId, controllerId, localPlayer, entityId] = gameEvent.parse();
		if (!cardId && !entityId) {
			return currentState;
		}

		const isPlayer = controllerId === localPlayer.PlayerId;
		const deck = isPlayer ? currentState.playerDeck : currentState.opponentDeck;
		const armorChange = gameEvent.additionalData.armorChange;
		if (armorChange >= 0) {
			return currentState;
		}

		if (deck.isActivePlayer) {
			let playerDamageByTurn = deck.damageTakenOnYourTurns;
			let playerDamageThisTurn = deck.damageTakenOnYourTurns.find((d) => d.turn === currentState.currentTurn);
			if (!playerDamageThisTurn) {
				playerDamageThisTurn = { turn: +currentState.currentTurn, damage: [], hits: [] };
				playerDamageByTurn = [...playerDamageByTurn, playerDamageThisTurn];
			}
			const newPlayerDamageThisTurn = {
				...playerDamageThisTurn,
				damage: [...playerDamageThisTurn.damage, Math.abs(armorChange)],
				hits: [...playerDamageThisTurn.hits, 1],
			};
			playerDamageByTurn = playerDamageByTurn.map((d) =>
				d.turn === newPlayerDamageThisTurn.turn ? newPlayerDamageThisTurn : d,
			);
			const playerDeck = deck.update({
				damageTakenThisTurn: (deck.damageTakenThisTurn ?? 0) + Math.abs(armorChange),
				damageTakenOnYourTurns: playerDamageByTurn,
			});
			return currentState.update({
				[isPlayer ? 'playerDeck' : 'opponentDeck']: playerDeck,
			});
		}

		return currentState;
	}

	event(): string {
		return GameEvent.ARMOR_CHANGED;
	}
}
