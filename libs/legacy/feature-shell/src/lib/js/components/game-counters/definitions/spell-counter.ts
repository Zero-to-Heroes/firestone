import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class SpellCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'spells';
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
	): SpellCounterDefinition {
		return new SpellCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.spellsPlayedThisMatch?.length ?? 0;
	}

	public emit(spellsPlayed: number): NonFunctionProperties<SpellCounterDefinition> {
		return {
			type: 'spells',
			value: spellsPlayed,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.YoggSaronMasterOfFate}.jpg`,
			cssClass: 'spell-counter',
			tooltip: this.i18n.translateString(`counters.spell.${this.side}`, { value: spellsPlayed }),
			standardCounter: true,
		};
	}
}
