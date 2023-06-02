import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BonelordFrostwhisperCounterDefinition
	implements CounterDefinition<GameState, { firstBonelordTurn: number; gameTagTurnNumber: number }>
{
	readonly type = 'bonelordFrostwhisper';
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
	): BonelordFrostwhisperCounterDefinition {
		return new BonelordFrostwhisperCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): { firstBonelordTurn: number; gameTagTurnNumber: number } {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return {
			firstBonelordTurn: deck.bonelordFrostwhisperFirstTurnTrigger,
			gameTagTurnNumber: gameState.gameTagTurnNumber,
		};
	}

	public emit(input: {
		firstBonelordTurn: number;
		gameTagTurnNumber: number;
	}): NonFunctionProperties<BonelordFrostwhisperCounterDefinition> {
		if (!input.firstBonelordTurn) {
			return null;
		}

		const delta = 6 - (input.gameTagTurnNumber - input.firstBonelordTurn);
		if (delta <= 0) {
			return null;
		}

		const value = Math.ceil(delta / 2);
		return {
			type: 'bonelordFrostwhisper',
			value: value,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.BonelordFrostwhisper}.jpg`,
			cssClass: 'bonelord-frostwhisper-counter',
			tooltip: this.i18n.translateString(`counters.bonelord-frostwhisper.${this.side}`, { value: value }),
			cardTooltips: null,
			standardCounter: true,
		};
	}
}
