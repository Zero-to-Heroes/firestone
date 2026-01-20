/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/_barrel';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2, PlayerImplementation } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

export class TavernBuffCounterDefinitionV2 extends CounterDefinitionV2<{ atk: number; health: number }> {
	public override id: CounterType = 'bgsTavernBuff';
	public override image = CardIds.Felemental_BG25_041;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player: PlayerImplementation<{ atk: number; health: number }> = {
		pref: 'playerBgsTavernBuffCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => {
			// Enchants where there is a single value for both attack and health
			const relevantEnchantsSingle = state.playerDeck.enchantments?.filter((e) =>
				[
					CardIds.ShopBuffPlayerEnchantDntEnchantment_BG_ShopBuff, // ok
				].includes(e.cardId as CardIds),
			); 4
			console.debug('[debug] bgshop buff', relevantEnchantsSingle);
			const value = {
				atk:
					relevantEnchantsSingle
						.map((e) => e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0)
						.reduce((a, b) => a + b, 0),
				// relevantEnchantsMulti
				// 	.map((e) => e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0)
				// 	.reduce((a, b) => a + b, 0),
				health:
					relevantEnchantsSingle
						.map((e) => e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0)
						.reduce((a, b) => a + b, 0),
				// relevantEnchantsMulti
				// 	.map((e) => e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_2] ?? 0)
				// 	.reduce((a, b) => a + b, 0),
			};
			if (value.atk === 0 && value.health === 0) {
				return null;
			}
			return value;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-tavern-stats-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-tavern-stats-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
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
		return this.i18n.translateString(`counters.tavern-stats.${side}`, {
			atk: atk,
			health: health,
		});
	}
}
