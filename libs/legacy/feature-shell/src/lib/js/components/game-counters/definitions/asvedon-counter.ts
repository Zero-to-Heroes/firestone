import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class AsvedonCounterDefinition implements CounterDefinition<GameState, readonly DeckCard[]> {
	readonly type = 'asvedon';
	readonly value: number | string;
	readonly valueImg: string;
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
	): AsvedonCounterDefinition {
		return new AsvedonCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly DeckCard[] {
		const otherDeck = this.side === 'player' ? gameState.opponentDeck : gameState.playerDeck;
		return otherDeck.spellsPlayedThisMatch;
	}

	public emit(spellsPlayedThisMatch: readonly DeckCard[]): NonFunctionProperties<AsvedonCounterDefinition> {
		const spells = spellsPlayedThisMatch;
		const lastPlayedSpell: string = !!spells?.length ? spells[spells.length - 1]?.cardId : null;
		if (!lastPlayedSpell) {
			return null;
		}
		const tooltip = this.i18n.translateString(`counters.asvedon.${this.side}`, {
			value: this.allCards.getCard(lastPlayedSpell).name,
		});
		return {
			type: 'asvedon',
			value: null,
			valueImg: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.AsvedonTheGrandshield}.jpg`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${lastPlayedSpell}.jpg`,
			cssClass: 'asvedon-counter',
			tooltip: tooltip,
			cardTooltips: [lastPlayedSpell],
			standardCounter: true,
		};
	}
}
