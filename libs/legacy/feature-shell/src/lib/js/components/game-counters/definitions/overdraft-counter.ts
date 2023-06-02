import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class OverdraftCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'overdraft';
	readonly value: number | string;
	readonly valueImg: string;
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
	): OverdraftCounterDefinition {
		return new OverdraftCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.overloadedCrystals ?? 0;
	}

	public emit(currentOverloaded: number): NonFunctionProperties<OverdraftCounterDefinition> {
		const tooltip = this.i18n.translateString(`counters.overdraft.${this.side}`, {
			value: currentOverloaded,
		});
		return {
			type: 'overdraft',
			value: currentOverloaded,
			valueImg: null,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Overdraft}.jpg`,
			cssClass: 'overdraft-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
