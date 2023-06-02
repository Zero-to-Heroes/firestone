import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class MonstrousParrotCounterDefinition implements CounterDefinition<GameState, string> {
	readonly type = 'monstrousParrot';
	readonly value: number | string;
	readonly valueImg: string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;
	readonly cardTooltips?: readonly string[];

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): MonstrousParrotCounterDefinition {
		return new MonstrousParrotCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): string {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.lastDeathrattleTriggered;
	}

	public emit(lastDeathrattleCardId: string): NonFunctionProperties<MonstrousParrotCounterDefinition> {
		const tooltip = this.i18n.translateString(`counters.monstrous-parrot.${this.side}`, {
			value: this.allCards.getCard(lastDeathrattleCardId).name,
		});
		return {
			type: 'monstrousParrot',
			value: null,
			valueImg: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.MonstrousParrot}.jpg`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${lastDeathrattleCardId}.jpg`,
			cssClass: 'monstrous-parrot-counter',
			tooltip: tooltip,
			cardTooltips: [lastDeathrattleCardId],
			standardCounter: true,
		};
	}
}
