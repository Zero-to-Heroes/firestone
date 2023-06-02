import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState, ShortCard } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class NagaGiantCounterDefinition
	implements
		CounterDefinition<
			GameState,
			{ spellsPlayedThisMatch: readonly ShortCard[]; manaSpentOnSpellsThisMatch: number }
		>
{
	readonly type = 'nagaGiant';
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
	): NagaGiantCounterDefinition {
		return new NagaGiantCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): {
		spellsPlayedThisMatch: readonly ShortCard[];
		manaSpentOnSpellsThisMatch: number;
	} {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return {
			spellsPlayedThisMatch: deck.spellsPlayedThisMatch,
			manaSpentOnSpellsThisMatch: deck.manaSpentOnSpellsThisMatch,
		};
	}

	public emit(input: {
		spellsPlayedThisMatch: readonly ShortCard[];
		manaSpentOnSpellsThisMatch: number;
	}): NonFunctionProperties<NagaGiantCounterDefinition> {
		const giantBaseCost = this.allCards.getCard(CardIds.NagaGiant)?.cost;
		const spellsPlayed = input.spellsPlayedThisMatch?.length ?? 0;
		const totalCostReduction = input.manaSpentOnSpellsThisMatch ?? 0;
		const costAfterReduction = Math.max(0, giantBaseCost - totalCostReduction);
		return {
			type: 'nagaGiant',
			value: costAfterReduction,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.NagaGiant}.jpg`,
			cssClass: 'naga-giant-counter',
			tooltip: this.i18n.translateString(`counters.naga-giant.${this.side}`, {
				cost: costAfterReduction,
				spells: spellsPlayed,
			}),
			standardCounter: true,
		};
	}
}
