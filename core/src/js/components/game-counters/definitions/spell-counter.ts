import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { CounterDefinition } from './_counter-definition';

export class SpellCounterDefinition implements CounterDefinition {
	readonly type = 'spells';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string): SpellCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const spellsPlayed = deck.spellsPlayedThisMatch?.length ?? 0;
		return {
			type: 'spells',
			value: spellsPlayed,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.YoggSaronMasterOfFate}.jpg`,
			cssClass: 'spell-counter',
			tooltip: `${side === 'player' ? 'You have' : 'Your opponent has'} played ${spellsPlayed} spell${
				spellsPlayed > 1 ? 's' : ''
			} this match`,
			standardCounter: true,
		};
	}
}
