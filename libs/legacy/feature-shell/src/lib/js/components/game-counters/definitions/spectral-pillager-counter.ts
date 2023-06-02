import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class SpectralPillagerCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'spectralPillager';
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
	): SpectralPillagerCounterDefinition {
		return new SpectralPillagerCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.cardsPlayedThisTurn?.length ?? 0;
	}

	public emit(cardsPlayedThisTurn: number): NonFunctionProperties<SpectralPillagerCounterDefinition> {
		return {
			type: 'spectralPillager',
			value: cardsPlayedThisTurn,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.SpectralPillager_ICC_910}.jpg`,
			cssClass: 'spectral-pillager-counter',
			tooltip: this.i18n.translateString('counters.spectral-pillager.player', { value: cardsPlayedThisTurn }),
			cardTooltips: null,
			standardCounter: true,
		};
	}
}
