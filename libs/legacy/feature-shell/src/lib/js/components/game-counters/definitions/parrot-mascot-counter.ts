import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class ParrotMascotCounterDefinition implements CounterDefinition<GameState, readonly DeckCard[]> {
	readonly type = 'parrotMascot';
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
	): ParrotMascotCounterDefinition {
		return new ParrotMascotCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly DeckCard[] {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.cardsPlayedThisTurn ?? [];
	}

	public emit(cardsPlayedThisTurn: readonly DeckCard[]): NonFunctionProperties<ParrotMascotCounterDefinition> {
		const cards = cardsPlayedThisTurn.map((c) => c.cardId);
		return {
			type: 'parrotMascot',
			value: null,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.ParrotMascot}.jpg`,
			cssClass: 'parrot-mascot-counter',
			tooltip: null,
			cardTooltips: cards,
			standardCounter: true,
		};
	}
}
