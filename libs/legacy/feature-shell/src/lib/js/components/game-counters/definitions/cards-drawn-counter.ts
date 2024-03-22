import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class CardsDrawnCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'cardsDrawn';
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
	): CardsDrawnCounterDefinition {
		return new CardsDrawnCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.cardDrawnThisGame ?? 0;
	}

	public emit(cardDrawnThisGame: number): NonFunctionProperties<CardsDrawnCounterDefinition> {
		const tooltip = this.i18n.translateString(`counters.cards-drawn.${this.side}`, {
			value: cardDrawnThisGame,
		});
		return {
			type: 'cardsDrawn',
			value: cardDrawnThisGame,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.PlayhouseGiant_TOY_530}.jpg`,
			cssClass: 'vanessa-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
