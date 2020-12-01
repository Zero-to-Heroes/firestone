import { GameState } from '../../../models/decktracker/game-state';
import { CounterDefinition } from './_counter-definition';

export class FatigueCounterDefinition implements CounterDefinition {
	readonly type = 'fatigue';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string): FatigueCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const fatigue = deck.fatigue || 0;
		return {
			type: 'fatigue',
			value: fatigue,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/FATIGUE.jpg`,
			cssClass: 'fatigue-counter',
			tooltip: `${side === 'player' ? 'Your ' : 'Your opponent '} current fatigue damage is ${fatigue}`,
			standardCounter: true,
		};
	}
}
