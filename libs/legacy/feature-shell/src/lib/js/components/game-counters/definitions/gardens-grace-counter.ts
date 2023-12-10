import { CardIds, SpellSchool } from '@firestone-hs/reference-data';
import { GameState, ShortCard } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class GardensGraceCounterDefinition
	implements
		CounterDefinition<
			GameState,
			{ spellsPlayedThisMatch: readonly ShortCard[]; manaSpentOnSpellsThisMatch: number }
		>
{
	readonly type = 'gardensGrace';
	readonly value: number | string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly cardTooltips?: readonly string[];
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
	): GardensGraceCounterDefinition {
		return new GardensGraceCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): {
		spellsPlayedThisMatch: readonly ShortCard[];
		manaSpentOnSpellsThisMatch: number;
	} {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return {
			spellsPlayedThisMatch: deck.spellsPlayedThisMatch,
			manaSpentOnSpellsThisMatch: deck.manaSpentOnHolySpellsThisMatch,
		};
	}

	public emit(input: {
		spellsPlayedThisMatch: readonly ShortCard[];
		manaSpentOnSpellsThisMatch: number;
	}): NonFunctionProperties<GardensGraceCounterDefinition> {
		const baseCost = this.allCards.getCard(CardIds.TheGardensGrace).cost;
		const spellsPlayed =
			input.spellsPlayedThisMatch?.filter((s) =>
				this.allCards.getCard(s.cardId)?.spellSchool?.includes(SpellSchool[SpellSchool.HOLY]),
			).length ?? 0;
		const totalCostReduction = input.manaSpentOnSpellsThisMatch ?? 0;
		const costAfterReduction = Math.max(0, baseCost - totalCostReduction);
		return {
			type: 'gardensGrace',
			value: costAfterReduction,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.TheGardensGrace}.jpg`,
			cssClass: 'gardens-grace-counter',
			tooltip: this.i18n.translateString(`counters.gardens-grace.${this.side}`, {
				cardName: this.allCards.getCard(CardIds.TheGardensGrace).name,
				cost: costAfterReduction,
				spells: spellsPlayed,
				spellsMana: totalCostReduction,
			}),
			standardCounter: true,
		};
	}
}
