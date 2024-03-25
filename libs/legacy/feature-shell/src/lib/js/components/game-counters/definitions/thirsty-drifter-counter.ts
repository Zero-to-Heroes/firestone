import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class ThirstyDrifterCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'thirstyDrifter';
	readonly value: number | string;
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
	): ThirstyDrifterCounterDefinition {
		return new ThirstyDrifterCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		return (gameState.cardsPlayedThisMatch ?? [])
			.filter((card) => card.side === this.side)
			.filter((card) => card.effectiveCost === 1).length;
	}

	public emit(cardsPlayed: number): NonFunctionProperties<ThirstyDrifterCounterDefinition> {
		const tooltip = this.i18n.translateString(`counters.thirsty-drifter.${this.side}`, {
			value: cardsPlayed,
		});
		return {
			type: 'thirstyDrifter',
			value: cardsPlayed,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.ThirstyDrifter_WW_387}.jpg`,
			cssClass: 'thirsty-drifter-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
