import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { CounterDefinition } from './_counter-definition';

export class HeroPowerDamageCounterDefinition implements CounterDefinition {
	readonly type = 'hero-power-damage';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string): HeroPowerDamageCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const heroPowerDamage = deck.heroPowerDamageThisMatch ?? 0;
		return {
			type: 'hero-power-damage',
			value: heroPowerDamage,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.MordreshFireEye}.jpg`,
			cssClass: 'hero-power-damage-counter',
			tooltip: `${
				side === 'player' ? 'Your' : 'Your opponent'
			} hero power has dealt ${heroPowerDamage} damage this game `,
			standardCounter: true,
		};
	}
}
