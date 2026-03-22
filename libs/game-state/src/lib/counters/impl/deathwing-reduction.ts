/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class DeathwingReductionCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'deathwingReduction';
	public override image = CardIds.Ultraxion_CATA_497;
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerDeathwingReductionCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number | null => {
			const value =
				state.playerDeck.enchantments
					.filter((e) => e.cardId === CardIds.Ultraxion_UltraxionHeraldedEnchantment_CATA_497e)
					.flatMap((e) => e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0)
					.reduce((a, b) => a + b, 0) || null;
			return value || null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.deathwing-reduction-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.deathwing-reduction-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentDeathwingReductionCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number | null =>
			state.opponentDeck.enchantments
				.filter((e) => e.cardId === CardIds.Ultraxion_UltraxionHeraldedEnchantment_CATA_497e)
				.flatMap((e) => e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0)
				.reduce((a, b) => a + b, 0) || null,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.deathwing-reduction-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.deathwing-reduction-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side].value(gameState);
		return this.i18n.translateString(`counters.deathwing-cost-reduction.${side}`, {
			value: value ?? 0,
		});
	}
}
