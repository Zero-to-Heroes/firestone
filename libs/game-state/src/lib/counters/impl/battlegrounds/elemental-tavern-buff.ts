/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { BattlegroundsState } from '@firestone/battlegrounds/core';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

export class ElementalTavernBuffCounterDefinitionV2 extends CounterDefinitionV2<{ atk: number; health: number }> {
	public override id: CounterType = 'elementalTavernBuff';
	public override image = CardIds.NomiKitchenNightmare_BGS_104;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsElementalTavernBuffCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => {
			const relevantEnchants = state.playerDeck.enchantments?.filter((e) =>
				[
					CardIds.NomiPlayerEnchantEnchantment,
					CardIds.DazzlingLightspawnPlayerEnchantEnchantment,
					CardIds.DancingBarnstormerPlayerEnchantDntEnchantment,
					CardIds.LivingAzerite_LivingAzeritePlayerEnchantDntEnchantment_BG28_707e,
					CardIds.NomiStickerPlayerEnchantDntEnchantment_BG30_MagicItem_544pe,
					CardIds.DuneDwellerPlayerEnchantDntEnchantment_BG31_815pe,
					CardIds.BlazingGreasefirePlayerEnchantDntEnchantment_BG32_843pe,
					CardIds.AlignTheElementsPlayerEnchDntEnchantment_BG32_814pe,
				].includes(e.cardId as CardIds),
			);
			const value = {
				atk: relevantEnchants
					.map((e) => e.tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value ?? 0)
					.reduce((a, b) => a + b, 0),
				health: relevantEnchants
					.map((e) => e.tags?.find((t) => t.Name === GameTag.TAG_SCRIPT_DATA_NUM_2)?.Value ?? 0)
					.reduce((a, b) => a + b, 0),
			};
			if (value.atk === 0 && value.health === 0) {
				return null;
			}
			return value;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-elemental-tavern-buff-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-elemental-tavern-buff-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override formatValue(
		value: { atk: number; health: number } | null | undefined,
	): null | undefined | number | string {
		return value ? `+${value.atk} / +${value.health}` : null;
	}

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
		bgState: BattlegroundsState,
	): string {
		const { atk, health } = this.player.value(gameState, bgState)!;
		return this.i18n.translateString(`counters.elemental-tavern-stats.${side}`, {
			atk: atk,
			health: health,
		});
	}
}
