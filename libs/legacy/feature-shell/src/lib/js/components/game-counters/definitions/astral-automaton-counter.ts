import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class AstralAutomatonCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'astralAutomaton';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): AstralAutomatonCounterDefinition {
		return new AstralAutomatonCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.astralAutomatonsSummoned ?? 0;
	}

	public emit(astralAutomatonSize: number): NonFunctionProperties<AstralAutomatonCounterDefinition> {
		return {
			type: 'astralAutomaton',
			value: astralAutomatonSize,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.AstralAutomaton}.jpg`,
			cssClass: 'pogo-counter',
			tooltip: this.i18n.translateString(`counters.specific-summons.${this.side}`, {
				value: astralAutomatonSize,
				cardName: this.allCards.getCard(CardIds.AstralAutomaton).name,
			}),
			standardCounter: true,
		};
	}
}
