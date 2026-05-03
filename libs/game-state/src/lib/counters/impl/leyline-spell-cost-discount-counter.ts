/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * TODO(35.4): Replace {@link PLACEHOLDER_LEYLINE_SPELL_COST_PLAYER_ENCHANT} with the real
 * player/hero enchant id from the live client; confirm TAG_SCRIPT_DATA_NUM_1 semantics.
 */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService, TempCardIds } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { PLACEHOLDER_LEYLINE_SPELL_COST_PLAYER_ENCHANT } from './deck-tracker-enchant-placeholders';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class LeylineSpellCostDiscountCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'leylineSpellCostDiscount';
	public override image = TempCardIds.MageMend501LeyWalker;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		TempCardIds.MageMend501LeyWalker as unknown as CardIds,
		TempCardIds.MageMend506MysticRunesaber as unknown as CardIds,
	];

	readonly player = {
		pref: 'playerLeylineSpellCostDiscountCounter' as const,
		display: (state: GameState): boolean =>
			state.playerDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_LEYLINE_SPELL_COST_PLAYER_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0) > 0,
		value: (state: GameState): number | null => {
			const v = state.playerDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_LEYLINE_SPELL_COST_PLAYER_ENCHANT)
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

	readonly opponent = {
		pref: 'opponentLeylineSpellCostDiscountCounter' as const,
		display: (state: GameState): boolean =>
			state.opponentDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_LEYLINE_SPELL_COST_PLAYER_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0) > 0,
		value: (state: GameState): number | null => {
			const v = state.opponentDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_LEYLINE_SPELL_COST_PLAYER_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0);
			return v > 0 ? v : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.leyline-spell-cost-discount-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.leyline-spell-cost-discount-tooltip'),
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
