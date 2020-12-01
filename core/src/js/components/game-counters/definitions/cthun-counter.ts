import { GameState } from '../../../models/decktracker/game-state';
import { CounterDefinition } from './_counter-definition';

export class CthunCounterDefinition implements CounterDefinition {
	readonly type = 'cthun';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string): CthunCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const cthunSize = deck.cthunSize || 6;
		return {
			type: 'cthun',
			value: cthunSize,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/OG_280.jpg`,
			cssClass: 'cthun-counter',
			tooltip: `${side === 'player' ? 'Your ' : 'Your opponent '} CThun is a ${cthunSize}/${cthunSize}`,
			standardCounter: true,
		};
	}
}
