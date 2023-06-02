import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class CorpseSpentCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'corpseSpent';
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
	): CorpseSpentCounterDefinition {
		return new CorpseSpentCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.corpsesSpent;
	}

	public emit(corpsesSpent: number): NonFunctionProperties<CorpseSpentCounterDefinition> {
		const tooltip = this.i18n.translateString(`counters.corpse.${this.side}`, {
			value: corpsesSpent,
		});
		return {
			type: 'corpseSpent',
			value: corpsesSpent,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.ClimacticNecroticExplosion}.jpg`,
			cssClass: 'corpse-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
