import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class FatigueCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'fatigue';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
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
	): FatigueCounterDefinition {
		return new FatigueCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.fatigue ?? 0;
	}

	public emit(currentFatigue: number): NonFunctionProperties<FatigueCounterDefinition> {
		// Next fatigue damage
		const nextFatigue = currentFatigue + 1 || 0;
		return {
			type: 'fatigue',
			value: nextFatigue,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/FATIGUE.jpg`,
			cssClass: 'fatigue-counter',
			tooltip: this.i18n.translateString(`counters.fatigue.${this.side}`, { value: nextFatigue }),
			standardCounter: true,
		};
	}
}
