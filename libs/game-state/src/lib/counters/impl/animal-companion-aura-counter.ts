/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * TODO(35.4): Replace {@link PLACEHOLDER_ANIMAL_COMPANION_PLAYER_ENCHANT} with the real aura
 * enchant for Animal Companion replacement (Tame Pet line).
 */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService, TempCardIds } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { PLACEHOLDER_ANIMAL_COMPANION_PLAYER_ENCHANT } from './deck-tracker-enchant-placeholders';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class AnimalCompanionAuraCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'animalCompanionAura';
	public override image = TempCardIds.HunterMend300TamePet;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		TempCardIds.HunterMend300TamePet as unknown as CardIds,
		TempCardIds.HunterMend303MigratingElekk as unknown as CardIds,
		TempCardIds.HunterMend307RoamFree as unknown as CardIds,
	];

	readonly player = {
		pref: 'playerAnimalCompanionAuraCounter' as const,
		display: (state: GameState): boolean =>
			state.playerDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_ANIMAL_COMPANION_PLAYER_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0) > 0,
		value: (state: GameState): number | null => {
			const v = state.playerDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_ANIMAL_COMPANION_PLAYER_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0);
			return v > 0 ? v : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.animal-companion-aura-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.animal-companion-aura-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentAnimalCompanionAuraCounter' as const,
		display: (state: GameState): boolean =>
			state.opponentDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_ANIMAL_COMPANION_PLAYER_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0) > 0,
		value: (state: GameState): number | null => {
			const v = state.opponentDeck.enchantments
				.filter((e) => e.cardId === PLACEHOLDER_ANIMAL_COMPANION_PLAYER_ENCHANT)
				.reduce((acc, e) => acc + (e.tags?.[GameTag.TAG_SCRIPT_DATA_NUM_1] ?? 0), 0);
			return v > 0 ? v : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.animal-companion-aura-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.animal-companion-aura-tooltip'),
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
		return this.i18n.translateString(`counters.animal-companion-aura.${side}`, { value });
	}
}
