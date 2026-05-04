/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * TODO(35.4): Replace {@link PLACEHOLDER_SILVER_HAND_RECRUIT_PLAYER_ENCHANT} with the real
 * Silver Hand Recruit buff enchant (Brash Battlemaster line).
 */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService, TempCardIds } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { PLACEHOLDER_SILVER_HAND_RECRUIT_PLAYER_ENCHANT } from './deck-tracker-enchant-placeholders';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class SilverHandRecruitAuraCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'silverHandRecruitAura';
	public override image = TempCardIds.PaladinMend800BrashBattlemaster;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		TempCardIds.PaladinMend800BrashBattlemaster as unknown as CardIds,
		TempCardIds.PaladinMend801ResilientSavior as unknown as CardIds,
		TempCardIds.PaladinMend803EmboldeningBlade as unknown as CardIds,
	];

	readonly player = {
		pref: 'playerSilverHandRecruitAuraCounter' as const,
		display: (state: GameState): boolean =>
			state.playerDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_SILVER_HAND_RECRUIT_PLAYER_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0) > 0,
		value: (state: GameState): number | null => {
			const v = state.playerDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_SILVER_HAND_RECRUIT_PLAYER_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0);
			return v > 0 ? v : null;
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
		display: (state: GameState): boolean =>
			state.opponentDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_SILVER_HAND_RECRUIT_PLAYER_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0) > 0,
		value: (state: GameState): number | null => {
			const v = state.opponentDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_SILVER_HAND_RECRUIT_PLAYER_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0);
			return v > 0 ? v : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.silver-hand-recruit-aura-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.silver-hand-recruit-aura-tooltip'),
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
		return this.i18n.translateString(`counters.silver-hand-recruit-aura.${side}`, { value });
	}
}
