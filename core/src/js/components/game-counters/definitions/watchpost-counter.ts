import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { CounterDefinition } from './_counter-definition';

export class WatchpostCounterDefinition implements CounterDefinition {
	readonly type = 'watchpost';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string): WatchpostCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const cardsPlayed = deck.watchpostsPlayedThisMatch || 0;
		return {
			type: 'watchpost',
			value: cardsPlayed,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Collectible.Neutral.FarWatchPost}.jpg`,
			cssClass: 'watchpost',
			tooltip: `${side === 'player' ? 'You have' : 'Your opponent has'} played ${cardsPlayed} watchpost${
				cardsPlayed > 1 ? 's' : ''
			} this match`,
			standardCounter: true,
		};
	}
}
