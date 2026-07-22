/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../../models/_barrel';
import { GameState } from '../../../models/game-state';
import { CounterDefinitionV2 } from '../../_counter-definition-v2';
import { CounterType } from '../../counter-type';

export class UndeadArmyCounterDefinitionV2 extends CounterDefinitionV2<{ atk: number; health: number }> {
	public override id: CounterType = 'bgsUndeadArmy';
	public override image = CardIds.AnubarakNerubianKing_BG25_007;
	public override type: 'hearthstone' | 'battlegrounds' = 'battlegrounds';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerBgsUndeadArmyCounter' as const,
		display: (state: GameState, bgState: BattlegroundsState | null | undefined): boolean => true,
		value: (state: GameState, bgState: BattlegroundsState | null | undefined) => {
			if (!bgState?.currentGame?.availableRaces?.includes(Race.UNDEAD)) {
				return null;
			}
			const enchantments = state.playerDeck.enchantments.filter(
				(e) => e.cardId === CardIds.UndeadBonusAttackPlayerEnchantDntEnchantment,
			);
			const value = {
				atk: enchantments.reduce((a, b) => a + (b.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0),
				health: enchantments.reduce((a, b) => a + (b.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_2] ?? 0), 0),
			};
			if (value.atk === 0 && value.health === 0) {
				return null;
			}
			return value;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-undead-army-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.battlegrounds.overlay.counter-undead-army-tooltip'),
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
		return this.i18n.translateString(`counters.bgs-undead-army.${side}`, {
			atk: atk,
			health: health,
		});
	}
}
