import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class MurozondTheInfiniteCounterDefinition implements CounterDefinition<GameState, readonly DeckCard[]> {
	readonly type = 'murozondTheInfinite';
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
	): MurozondTheInfiniteCounterDefinition {
		return new MurozondTheInfiniteCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly DeckCard[] {
		const otherDeck = this.side === 'player' ? gameState.opponentDeck : gameState.playerDeck;
		const cards = otherDeck.isActivePlayer ? otherDeck.cardsPlayedThisTurn : otherDeck.cardsPlayedLastTurn;
		return cards;
	}

	public emit(cardsPlayedLastTurn: readonly DeckCard[]): NonFunctionProperties<MurozondTheInfiniteCounterDefinition> {
		const cardIdsPlayedLastTurn: readonly string[] = cardsPlayedLastTurn?.map((c) => c.cardId);
		return {
			type: 'murozondTheInfinite',
			value: null,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.MurozondTheInfinite_DRG_090}.jpg`,
			cssClass: 'murozond-counter',
			tooltip: null,
			cardTooltips: cardIdsPlayedLastTurn,
			standardCounter: true,
		};
	}
}
