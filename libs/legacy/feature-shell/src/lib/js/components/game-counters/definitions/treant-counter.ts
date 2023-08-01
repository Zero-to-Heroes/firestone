import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class TreantCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'treant';
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
	): TreantCounterDefinition {
		return new TreantCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.treantsSummoned ?? 0;
	}

	public emit(treantsSummoned: number): NonFunctionProperties<TreantCounterDefinition> {
		return {
			type: 'treant',
			value: treantsSummoned,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.ForestSeedlings_TreantToken}.jpg`,
			cssClass: 'pogo-counter',
			tooltip: this.i18n.translateString(`counters.specific-summons.${this.side}`, {
				value: treantsSummoned,
				cardName: this.allCards.getCard(CardIds.ForestSeedlings_TreantToken).name,
			}),
			standardCounter: true,
		};
	}
}
