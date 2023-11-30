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
		const totalCardsToDraw = uniqueSpellSchools?.length || 0;
		const tooltip = !!uniqueSpellSchools?.length
			? this.i18n.translateString(`counters.multicaster.${this.side}-new`, {
					cardsTotal: totalCardsToDraw,
					schools:
						'<br/>' +
						uniqueSpellSchools
							?.map((spellSchool) =>
								this.i18n.translateString('global.spellschool.' + spellSchool.toLowerCase()),
							)
							.sort()
							?.join('<br/>'),
			  })
			: this.i18n.translateString(`counters.multicaster.${this.side}`);
		return {
			type: 'multicaster',
			value: `${totalCardsToDraw}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.DiscoveryOfMagic}.jpg`,
			cssClass: 'spell-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
