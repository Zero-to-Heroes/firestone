import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class WheelOfDeathCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'wheelOfDeath';
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
	): WheelOfDeathCounterDefinition {
		return new WheelOfDeathCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.opponentDeck : gameState.playerDeck;
		return deck.wheelOfDeathCounter ?? 0;
	}

	public emit(wheelOfDeathCounter: number): NonFunctionProperties<WheelOfDeathCounterDefinition> {
		const tooltip = this.i18n.translateString(`counters.wheel-of-death.${this.side}`, {
			value: wheelOfDeathCounter,
		});
		return {
			type: 'wheelOfDeath',
			value: wheelOfDeathCounter,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.WheelOfDeath_TOY_529}.jpg`,
			cssClass: 'wheel-of-death-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
