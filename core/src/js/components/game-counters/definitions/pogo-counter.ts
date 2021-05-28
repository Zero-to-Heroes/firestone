import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { CounterDefinition } from './_counter-definition';

export class PogoCounterDefinition implements CounterDefinition {
	readonly type = 'pogo';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string): PogoCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const pogoHopperSize = deck.pogoHopperSize || 0;
		return {
			type: 'pogo',
			value: pogoHopperSize,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Collectible.Rogue.PogoHopper1}.jpg`,
			cssClass: 'pogo-counter',
			tooltip: `${side === 'player' ? 'You have' : 'Your opponent has'} played ${pogoHopperSize} Pogo-Hoppers`,
			standardCounter: true,
		};
	}
}
