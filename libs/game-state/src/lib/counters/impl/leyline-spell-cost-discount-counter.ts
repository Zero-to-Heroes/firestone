/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class LeylineSpellCostDiscountCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'leylineSpellCostDiscount';
	public override image = CardIds.LeyWalker_MEND_501;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerLeylineSpellCostDiscountCounter' as const,
		display: (state: GameState): boolean => (this.player.value(state) ?? 0) > 0,
		value: (state: GameState): number | null => {
			const v = state.playerDeck.enchantments.filter(
				(e) => e.cardId === CardIds.UnblockLeylineEnchantment_MEND_501t2e,
			).length;
			return v > 0 ? v : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.leyline-spell-cost-discount-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.leyline-spell-cost-discount-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentLeylineSpellCostDiscountCounter' as const,
		display: (state: GameState): boolean => (this.opponent.value(state) ?? 0) > 0,
		value: (state: GameState): number | null => {
			const v = state.opponentDeck.enchantments
				.filter((e) => e.cardId === CardIds.UnblockLeylineEnchantment_MEND_501t2e)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0);
			return v > 0 ? v : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.leyline-spell-cost-discount-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.leyline-spell-cost-discount-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string | null {
		const value = this[side]!.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.leyline-spell-cost-discount.${side}`, { value });
	}
}
