import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class DragonsSummonedCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'dragonsSummoned';
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
	): DragonsSummonedCounterDefinition {
		return new DragonsSummonedCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.dragonsSummoned ?? 0;
	}

	public emit(dragonsSummoned: number): NonFunctionProperties<DragonsSummonedCounterDefinition> {
		return {
			type: 'dragonsSummoned',
			value: dragonsSummoned,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.FyeTheSettingSun_WW_825}.jpg`,
			cssClass: 'dragons-summoned-counter',
			tooltip: this.i18n.translateString(`counters.specific-summons.${this.side}`, {
				value: dragonsSummoned,
				cardName: this.i18n.translateString('global.tribe.dragon'),
			}),
			standardCounter: true,
		};
	}
}
