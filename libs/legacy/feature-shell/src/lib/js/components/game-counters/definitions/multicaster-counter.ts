import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class MulticasterCounterDefinition implements CounterDefinition<GameState, readonly string[]> {
	readonly type = 'multicaster';
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
	): MulticasterCounterDefinition {
		return new MulticasterCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly string[] {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.uniqueSpellSchools ?? [];
	}

	public emit(uniqueSpellSchools: readonly string[]): NonFunctionProperties<MulticasterCounterDefinition> {
		const totalCardsToDraw = uniqueSpellSchools?.length;
		const tooltip = this.i18n.translateString(`counters.multicaster.${this.side}`, {
			cardsTotal: totalCardsToDraw,
			schools: uniqueSpellSchools
				?.map((spellSchool) => this.i18n.translateString('global.spellschool.' + spellSchool.toLowerCase()))
				?.join(', '),
		});
		return {
			type: 'multicaster',
			value: `${totalCardsToDraw}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.InquisitiveCreation}.jpg`,
			cssClass: 'spell-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
