import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class AnachronosCounterDefinition
	implements CounterDefinition<GameState, { lastAnachronosTurn: number; gameTagTurnNumber: number }>
{
	readonly type = 'anachronos';
	readonly value: number | string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly cardTooltips?: readonly string[];
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
	): AnachronosCounterDefinition {
		return new AnachronosCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): { lastAnachronosTurn: number; gameTagTurnNumber: number } {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const result = {
			lastAnachronosTurn: deck.anachronosTurnsPlayed[deck.anachronosTurnsPlayed.length - 1],
			gameTagTurnNumber: gameState.gameTagTurnNumber,
		};
		if (!result.lastAnachronosTurn) {
			return null;
		}
	}

	public emit(info: {
		lastAnachronosTurn: number;
		gameTagTurnNumber: number;
	}): NonFunctionProperties<AnachronosCounterDefinition> {
		const delta = 4 - (info.gameTagTurnNumber - info.lastAnachronosTurn);
		if (delta <= 0) {
			return null;
		}

		const value = Math.ceil(delta / 2);
		return {
			type: 'anachronos',
			value: value,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Anachronos}.jpg`,
			cssClass: 'anachronos-counter',
			tooltip: this.i18n.translateString(`counters.anachronos.player`, { value: value }),
			cardTooltips: null,
			standardCounter: true,
		};
	}
}
