import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class PiratesSummonedCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'piratesSummoned';
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
	): PiratesSummonedCounterDefinition {
		return new PiratesSummonedCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.piratesSummoned ?? 0;
	}

	public emit(piratesSummoned: number): NonFunctionProperties<PiratesSummonedCounterDefinition> {
		return {
			type: 'piratesSummoned',
			value: piratesSummoned,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Hooktusk}.jpg`,
			cssClass: 'pirates-summoned-counter',
			tooltip: this.i18n.translateString(`counters.specific-summons.${this.side}`, {
				value: piratesSummoned,
				cardName: this.i18n.translateString('global.tribe.pirate'),
			}),
			standardCounter: true,
		};
	}
}
