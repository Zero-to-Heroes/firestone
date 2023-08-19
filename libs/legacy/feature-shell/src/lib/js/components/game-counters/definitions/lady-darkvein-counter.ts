import { CardIds, SpellSchool } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState, ShortCard } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class LadyDarkveinCounterDefinition implements CounterDefinition<GameState, readonly ShortCard[]> {
	readonly type = 'ladyDarkvein';
	readonly value: number | string;
	readonly valueImg: string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;
	readonly cardTooltips?: readonly string[];

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): LadyDarkveinCounterDefinition {
		return new LadyDarkveinCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly ShortCard[] {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.spellsPlayedThisMatch ?? [];
	}

	public emit(spellsPlayedThisMatch: readonly ShortCard[]): NonFunctionProperties<LadyDarkveinCounterDefinition> {
		const lastShadowSpellCardId: string = spellsPlayedThisMatch
			.filter((card) => {
				const ref = this.allCards.getCard(card.cardId);
				return ref.spellSchool === SpellSchool[SpellSchool.SHADOW];
			})
			.pop()?.cardId;
		if (!lastShadowSpellCardId) {
			return null;
		}

		const tooltip = this.i18n.translateString(`counters.lady-darkvein.${this.side}`, {
			value: this.allCards.getCard(lastShadowSpellCardId).name,
		});
		return {
			type: 'ladyDarkvein',
			value: null,
			valueImg: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.LadyDarkvein}.jpg`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${lastShadowSpellCardId}.jpg`,
			cssClass: 'lady-darkvein-counter',
			tooltip: tooltip,
			cardTooltips: [lastShadowSpellCardId],
			standardCounter: true,
		};
	}
}
