/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class SilverHandRecruitAuraCounterDefinitionV2 extends CounterDefinitionV2<{ attack: number; health: number }> {
	public override id: CounterType = 'silverHandRecruitAura';
	public override image = CardIds.EmboldeningBlade_MEND_803;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		// CardIds.BrashBattlemaster_MEND_800 ,
		// CardIds.ResilientSavior_MEND_801,
		// CardIds.EmboldeningBlade_MEND_803,
	];

	readonly player = {
		pref: 'playerSilverHandRecruitAuraCounter' as const,
		display: (state: GameState): boolean => this.player.value(state) !== null,
		value: (state: GameState): { attack: number; health: number } | null => {
			const enchs = state.playerDeck.enchantments;
			const attack =
				enchs.filter((e) => e.cardId === CardIds.BrashBattlemaster_RecruitsMightEnchantment_MEND_800e).length +
				enchs.filter((e) => e.cardId === CardIds.EmboldeningBlade_EmboldenedEnchantment_MEND_803e).length;
			const health =
				enchs.filter((e) => e.cardId === CardIds.ResilientSavior_RecruitsResilienceEnchantment_MEND_801e)
					.length +
				enchs.filter((e) => e.cardId === CardIds.EmboldeningBlade_EmboldenedEnchantment_MEND_803e).length;
			if (attack === 0 && health === 0) {
				return null;
			}
			return {
				attack,
				health,
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.silver-hand-recruit-aura-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.silver-hand-recruit-aura-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentSilverHandRecruitAuraCounter' as const,
		display: (state: GameState): boolean => this.opponent.value(state) !== null,
		value: (state: GameState): { attack: number; health: number } | null => {
			const enchs = state.opponentDeck.enchantments;
			const attack =
				enchs.filter((e) => e.cardId === CardIds.BrashBattlemaster_RecruitsMightEnchantment_MEND_800e).length +
				enchs.filter((e) => e.cardId === CardIds.EmboldeningBlade_EmboldenedEnchantment_MEND_803e).length;
			const health =
				enchs.filter((e) => e.cardId === CardIds.ResilientSavior_RecruitsResilienceEnchantment_MEND_801e)
					.length +
				enchs.filter((e) => e.cardId === CardIds.EmboldeningBlade_EmboldenedEnchantment_MEND_803e).length;
			if (attack === 0 && health === 0) {
				return null;
			}
			return {
				attack,
				health,
			};
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.silver-hand-recruit-aura-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.silver-hand-recruit-aura-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	override formatValue(
		value: { attack: number; health: number } | null | undefined,
	): null | undefined | number | string {
		return value ? `+${value.attack}/+${value.health}` : null;
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string | null {
		const value = this[side]!.value(gameState);
		return this.i18n.translateString(`counters.silver-hand-recruit-aura.${side}`, {
			atk: value!.attack,
			health: value!.health,
		});
	}
}
