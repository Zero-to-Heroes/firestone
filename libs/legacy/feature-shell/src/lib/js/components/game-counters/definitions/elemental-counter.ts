import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class ElementalCounterDefinition
	implements CounterDefinition<GameState, { elementalsPlayedThisTurn: number; elementalsPlayedLastTurn: number }>
{
	readonly type = 'elemental';
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
	): ElementalCounterDefinition {
		return new ElementalCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): { elementalsPlayedThisTurn: number; elementalsPlayedLastTurn: number } {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return {
			elementalsPlayedThisTurn: deck.elementalsPlayedThisTurn ?? 0,
			elementalsPlayedLastTurn: deck.elementalsPlayedLastTurn ?? 0,
		};
	}

	public emit(input: {
		elementalsPlayedThisTurn: number;
		elementalsPlayedLastTurn: number;
	}): NonFunctionProperties<ElementalCounterDefinition> {
		return {
			type: 'elemental',
			value: `${input.elementalsPlayedLastTurn}/${input.elementalsPlayedThisTurn}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.GrandFinale}.jpg`,
			cssClass: 'spell-counter',
			tooltip: this.i18n.translateString(`counters.elemental.${this.side}`, {
				lastTurn: input.elementalsPlayedLastTurn,
				thisTurn: input.elementalsPlayedThisTurn,
			}),
			standardCounter: true,
		};
	}
}
