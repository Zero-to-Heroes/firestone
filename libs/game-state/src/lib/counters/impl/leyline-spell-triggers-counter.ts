/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * TODO(35.4): Replace {@link PLACEHOLDER_LEYLINE_BONUS_TRIGGERS_ENCHANT} with the real enchant
 * that tracks Leyline trigger counts (e.g. Surge Needle).
 */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService, TempCardIds } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { PLACEHOLDER_LEYLINE_BONUS_TRIGGERS_ENCHANT } from './deck-tracker-enchant-placeholders';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class LeylineSpellTriggersCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'leylineSpellTriggers';
	public override image = TempCardIds.MageMend503SurgeNeedle;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [TempCardIds.MageMend503SurgeNeedle as unknown as CardIds];

	readonly player = {
		pref: 'playerLeylineSpellTriggersCounter' as const,
		display: (state: GameState): boolean =>
			state.playerDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_LEYLINE_BONUS_TRIGGERS_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0) > 0,
		value: (state: GameState): number | null => {
			const v = state.playerDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_LEYLINE_BONUS_TRIGGERS_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0);
			return v > 0 ? v : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.leyline-spell-triggers-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.leyline-spell-triggers-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentLeylineSpellTriggersCounter' as const,
		display: (state: GameState): boolean =>
			state.opponentDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_LEYLINE_BONUS_TRIGGERS_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0) > 0,
		value: (state: GameState): number | null => {
			const v = state.opponentDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_LEYLINE_BONUS_TRIGGERS_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0);
			return v > 0 ? v : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.leyline-spell-triggers-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.leyline-spell-triggers-tooltip'),
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
		return this.i18n.translateString(`counters.leyline-spell-triggers.${side}`, { value });
	}
}
