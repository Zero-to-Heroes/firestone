/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * TODO(35.4): Replace {@link PLACEHOLDER_TALYA_EARTHSTRIDER_GLOBAL_ENCHANT} with Talya Earthstrider's
 * global player enchant id once live.
 */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService, TempCardIds } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { PLACEHOLDER_TALYA_EARTHSTRIDER_GLOBAL_ENCHANT } from './deck-tracker-enchant-placeholders';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class TalyaEarthstriderGlobalAuraCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'talyaEarthstriderGlobalAura';
	public override image = TempCardIds.HunterMend304TalyaEarthstrider;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [TempCardIds.HunterMend304TalyaEarthstrider as unknown as CardIds];

	readonly player = {
		pref: 'playerTalyaEarthstriderGlobalAuraCounter' as const,
		display: (state: GameState): boolean =>
			state.playerDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_TALYA_EARTHSTRIDER_GLOBAL_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0) > 0,
		value: (state: GameState): number | null => {
			const v = state.playerDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_TALYA_EARTHSTRIDER_GLOBAL_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0);
			return v > 0 ? v : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.talya-earthstrider-global-aura-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.talya-earthstrider-global-aura-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentTalyaEarthstriderGlobalAuraCounter' as const,
		display: (state: GameState): boolean =>
			state.opponentDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_TALYA_EARTHSTRIDER_GLOBAL_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0) > 0,
		value: (state: GameState): number | null => {
			const v = state.opponentDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_TALYA_EARTHSTRIDER_GLOBAL_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0);
			return v > 0 ? v : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString(
					'settings.decktracker.opponent-deck.counters.talya-earthstrider-global-aura-label',
				),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString(
					'settings.decktracker.opponent-deck.counters.talya-earthstrider-global-aura-tooltip',
				),
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
		return this.i18n.translateString(`counters.talya-earthstrider-global-aura.${side}`, { value });
	}
}
