import { DeckCard } from '../../../models/decktracker/deck-card';
import { GameState } from '../../../models/decktracker/game-state';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BolnerHammerbeakIndicator implements CounterDefinition {
	readonly type = 'bolner';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string, allCards: CardsFacadeService): BolnerHammerbeakIndicator {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const firstBattlecry: DeckCard = deck.firstBattlecryPlayedThisTurn(allCards);
		if (!firstBattlecry) {
			return null;
		}

		return {
			type: 'bolner',
			value: null,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${firstBattlecry.cardId}.jpg`,
			cssClass: 'bolner-counter',
			tooltip: `${firstBattlecry.cardName} was the first battlecry card played this turn'`,
			standardCounter: true,
		};
	}
}
