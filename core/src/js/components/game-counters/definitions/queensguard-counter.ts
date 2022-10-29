import { CardIds, CardType } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class QueensguardCounterDefinition implements CounterDefinition {
	readonly type = 'queensguard';
	readonly value: number | string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly cardTooltips?: readonly string[];
	readonly standardCounter = true;

	static create(
		gameState: GameState,
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): QueensguardCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const cardsPlayedThisTurn = deck.cardsPlayedThisTurn
			.map((c) => c.cardId)
			.map((cardId) => allCards.getCard(cardId))
			.filter((card) => card.type?.toUpperCase() === CardType[CardType.SPELL]);
		return {
			type: 'queensguard',
			value: cardsPlayedThisTurn.length,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Queensguard}.jpg`,
			cssClass: 'queensguard-counter',
			tooltip: null,
			cardTooltips: null,
			standardCounter: true,
		};
	}
}
