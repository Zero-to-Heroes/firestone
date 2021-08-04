import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { CounterDefinition } from './_counter-definition';

export class ElwynnBoarCounterDefinition implements CounterDefinition {
	readonly type = 'elwynn-boar';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string): ElwynnBoarCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const boarDeaths = deck.elwynnBoarsDeadThisMatch || 0;
		return {
			type: 'elwynn-boar',
			value: boarDeaths,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Collectible.Neutral.ElwynnBoar}.jpg`,
			cssClass: 'elwynn-boar-counter',
			tooltip: `${boarDeaths} boars have died for ${side === 'player' ? 'you' : 'your opponent'}`,
			standardCounter: true,
		};
	}
}
