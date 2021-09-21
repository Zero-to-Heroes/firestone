import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { CounterDefinition } from './_counter-definition';

export class LibramCounterDefinition implements CounterDefinition {
	readonly type = 'libram';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string): LibramCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const cardsPlayed = deck.libramsPlayedThisMatch || 0;
		return {
			type: 'libram',
			value: cardsPlayed,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.LibramOfWisdom1}.jpg`,
			cssClass: 'watchpost',
			tooltip: `${side === 'player' ? 'You have' : 'Your opponent has'} played ${cardsPlayed} libram${
				cardsPlayed > 1 ? 's' : ''
			} this match`,
			standardCounter: true,
		};
	}
}
