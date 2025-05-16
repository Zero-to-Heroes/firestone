/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2, PlayerImplementation } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

export class ElementalTavernBuffCounterDefinitionV2 extends CounterDefinitionV2<{ atk: number; health: number }> {
	public override id: CounterType = 'elementalTavernBuff';
	public override image = CardIds.NomiKitchenNightmare_BGS_104;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player: PlayerImplementation<{ atk: number; health: number }> = {
		pref: 'playerBgsElementalTavernBuffCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => {
			// Enchants where there is a single value for both attack and health
			const relevantEnchantsSingle = state.playerDeck.enchantments?.filter((e) =>
				[
					CardIds.NomiStickerPlayerEnchantDntEnchantment_BG30_MagicItem_544pe, // ok
				].includes(e.cardId as CardIds),
			);
			const relevantEnchantsMulti = state.playerDeck.enchantments?.filter((e) =>
				[
					CardIds.DuneDwellerPlayerEnchantDntEnchantment_BG31_815pe, // ok
					CardIds.DazzlingLightspawnPlayerEnchantEnchantment,
					CardIds.NomiPlayerEnchantEnchantment,
					CardIds.DancingBarnstormerPlayerEnchantDntEnchantment,
					CardIds.LivingAzerite_LivingAzeritePlayerEnchantDntEnchantment_BG28_707e,
					CardIds.BlazingGreasefirePlayerEnchantDntEnchantment_BG32_843pe, // ok
					CardIds.AlignTheElementsPlayerEnchDntEnchantment_BG32_814pe, // ok
				].includes(e.cardId as CardIds),
			);
			const value = {
				atk:
					relevantEnchantsSingle
						.map((e) => e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0)
						.reduce((a, b) => a + b, 0) +
					relevantEnchantsMulti
						.map((e) => e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0)
						.reduce((a, b) => a + b, 0),
				health:
					relevantEnchantsSingle
						.map((e) => e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0)
						.reduce((a, b) => a + b, 0) +
					relevantEnchantsMulti
						.map((e) => e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_2] ?? 0)
						.reduce((a, b) => a + b, 0),
			};
			// console.debug(
			// 	'[elemntal-tavern-buff] value',
			// 	value,
			// 	relevantEnchantsSingle,
			// 	relevantEnchantsMulti,
			// 	state.playerDeck.enchantments,
			// );
			if (value.atk === 0 && value.health === 0) {
				return null;
			}
			return value;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-elemental-tavern-stats-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-elemental-tavern-stats-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override formatValue(
		value: { atk: number; health: number } | null | undefined,
	): null | undefined | number | string {
		return value ? `+${value.atk}/+${value.health}` : null;
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
	): string {
		const { atk, health } = this.player.cachedValue!;
		return this.i18n.translateString(`counters.elemental-tavern-stats.${side}`, {
			atk: atk,
			health: health,
		});
	}
}
