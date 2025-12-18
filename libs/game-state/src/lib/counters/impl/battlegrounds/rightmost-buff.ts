import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/_barrel';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../_exports';

export class RightmostBuffCounterDefinitionV2 extends CounterDefinitionV2<{ atk: number; health: number }> {
	public override id: CounterType = 'bgsRightmostBuff';
	public override image = CardIds.AcidRainfall_BG34_857;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsRightmostBuffCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => {
			const enchants = state.playerDeck.enchantments.filter(
				(e) => e.cardId === CardIds.RightMostTavernMinionBuffPlayerEnchDntEnchantment_BG34_854pe,
			);

			const atk = enchants.map((e) => e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0).reduce((a, b) => a + b, 0);
			const health = enchants.map((e) => e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_2] ?? 0).reduce((a, b) => a + b, 0);
			if (atk === 0 && health === 0) {
				return null;
			}
			return {
				atk,
				health,
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-rightmost-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-rightmost-tooltip'),
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
		const { atk, health } = this.player.value(gameState, bgState)!;
		return this.i18n.translateString(`counters.bgs-rightmost-buff.${side}`, {
			atk: atk,
			health: health,
		});
	}
}
