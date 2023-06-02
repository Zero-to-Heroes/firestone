import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class CthunCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'cthun';
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
	): CthunCounterDefinition {
		return new CthunCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.cthunSize || 6;
	}

	public emit(cthunSize: number): NonFunctionProperties<CthunCounterDefinition> {
		return {
			type: 'cthun',
			value: cthunSize,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/OG_280.jpg`,
			cssClass: 'cthun-counter',
			tooltip: this.i18n.translateString(`counters.cthun.${this.side}`, { value: cthunSize }),
			standardCounter: true,
		};
	}
}
