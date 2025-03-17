/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, SpellSchool } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState, ShortCard } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class GardensGraceCounterDefinitionV2 extends CounterDefinitionV2<{
	spellsPlayedThisMatch: readonly ShortCard[];
	manaSpentOnSpellsThisMatch: number;
}> {
	public override id: CounterType = 'gardensGrace';
	public override image = CardIds.TheGardensGrace;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.TheGardensGrace];

	readonly player = {
		pref: 'playerGardensGraceCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return {
				spellsPlayedThisMatch: state.playerDeck.spellsPlayedThisMatch,
				manaSpentOnSpellsThisMatch: state.playerDeck.manaSpentOnHolySpellsThisMatch,
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.gardens-grace-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.gardens-grace-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override formatValue(
		value: { spellsPlayedThisMatch: readonly ShortCard[]; manaSpentOnSpellsThisMatch: number } | null | undefined,
	): null | undefined | number | string {
		return value?.manaSpentOnSpellsThisMatch ?? 0;
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string | null {
		const value = this[side]?.value(gameState);
		if (!value) {
			return null;
		}
		const baseCost = this.allCards.getCard(CardIds.TheGardensGrace).cost!;
		const spellsPlayed =
			value.spellsPlayedThisMatch?.filter((s) =>
				this.allCards.getCard(s.cardId)?.spellSchool?.includes(SpellSchool[SpellSchool.HOLY]),
			).length ?? 0;
		const totalCostReduction = value.manaSpentOnSpellsThisMatch ?? 0;
		const costAfterReduction = Math.max(0, baseCost - totalCostReduction);
		return this.i18n.translateString(`counters.gardens-grace.${side}`, {
			cardName: this.allCards.getCard(CardIds.TheGardensGrace).name,
			cost: costAfterReduction,
			spells: spellsPlayed,
			spellsMana: totalCostReduction,
		});
	}
}
