import { GameState } from '../../../models/decktracker/game-state';
import { CounterDefinition } from './_counter-definition';

export class AttackCounterDefinition implements CounterDefinition {
	readonly type = 'attack';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = false;

	static create(gameState: GameState, side: string): AttackCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const totalAttackOnBoard = (deck.totalAttackOnBoard?.board || 0) + (deck.totalAttackOnBoard?.hero || 0);
		return {
			type: 'attack',
			value: totalAttackOnBoard,
			image: 'assets/svg/attack.svg',
			cssClass: 'attack-counter',
			tooltip: `${
				side === 'player' ? 'You have' : 'Your opponent has'
			} ${totalAttackOnBoard} total attack from board and hero`,
			standardCounter: false,
		};
	}
}
