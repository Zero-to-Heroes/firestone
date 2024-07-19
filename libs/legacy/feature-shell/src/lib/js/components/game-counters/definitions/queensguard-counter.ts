import { CardIds, CardType } from '@firestone-hs/reference-data';
import { DeckCard, GameState } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class QueensguardCounterDefinition implements CounterDefinition<GameState, readonly DeckCard[]> {
	readonly type = 'queensguard';
	readonly value: number | string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly cardTooltips?: readonly string[];
	readonly standardCounter = true;

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): QueensguardCounterDefinition {
		return new QueensguardCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly DeckCard[] {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.cardsPlayedThisTurn ?? [];
	}

	public emit(deckCardsPlayedThisTurn: readonly DeckCard[]): NonFunctionProperties<QueensguardCounterDefinition> {
		const cardsPlayedThisTurn = deckCardsPlayedThisTurn
			.map((c) => c.cardId)
			.map((cardId) => this.allCards.getCard(cardId))
			.filter((card) => card.type?.toUpperCase() === CardType[CardType.SPELL]);
		return {
			type: 'queensguard',
			value: cardsPlayedThisTurn.length,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Queensguard}.jpg`,
			cssClass: 'queensguard-counter',
			tooltip: this.i18n.translateString(`counters.queensguard.${this.side}`, {
				value: cardsPlayedThisTurn.length,
			}),
			cardTooltips: null,
			standardCounter: true,
		};
	}
}
