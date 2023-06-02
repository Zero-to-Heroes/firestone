import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class JadeCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'jadeGolem';
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
	): JadeCounterDefinition {
		return new JadeCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.jadeGolemSize ?? 0;
	}

	public emit(golemSize: number): NonFunctionProperties<JadeCounterDefinition> {
		const cardId = CardIds.JadeGolemToken_CFM_712_t01;
		return {
			type: 'jadeGolem',
			value: golemSize,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`,
			cssClass: 'jade-counter',
			tooltip: this.i18n.translateString(`counters.jade.${this.side}`, { value: golemSize }),
			standardCounter: true,
		};
	}
}
