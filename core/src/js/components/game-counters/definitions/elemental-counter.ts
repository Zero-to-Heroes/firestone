import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { CounterDefinition } from './_counter-definition';

export class ElementalCounterDefinition implements CounterDefinition {
	readonly type = 'elemental';
	readonly value: number | string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string): ElementalCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const elementalsPlayedThisTurn = deck.elementalsPlayedThisTurn || 0;
		const elementalsPlayedLastTurn = deck.elementalsPlayedLastTurn || 0;
		return {
			type: 'elemental',
			value: `${elementalsPlayedLastTurn}/${elementalsPlayedThisTurn}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.ManaCyclone}.jpg`,
			cssClass: 'spell-counter',
			tooltip: `${
				side === 'player' ? 'You have' : 'Your opponent has'
			} played ${elementalsPlayedLastTurn} elemental${
				elementalsPlayedLastTurn > 1 ? 's' : ''
			} last turn, and ${elementalsPlayedThisTurn} elemental${elementalsPlayedThisTurn > 1 ? 's' : ''} this turn`,
			standardCounter: true,
		};
	}
}
