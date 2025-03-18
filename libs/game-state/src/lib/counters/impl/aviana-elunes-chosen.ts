/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class AvianaElunesChoseCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'avianaElunesChosen';
	public override image = CardIds.AvianaElunesChosen_EDR_895;
	public override cards: readonly CardIds[] = [CardIds.AvianaElunesChosen_EDR_895] as any[];

	readonly player = {
		pref: 'playerAvianaElunesChosenCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.playerDeck.enchantments
				.filter((e) => e.cardId === CardIds.AvianaElunesChosen_MoonCycleEnchantmentToken_EDR_895t)
				.flatMap((e) => e?.tags?.find((e) => e.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value ?? 0)
				.reduce((a, b) => a + b, 0) ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.aviana-elunes-chosen-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.aviana-elunes-chosen-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentAvianaElunesChosenCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.opponentDeck.enchantments
				.filter((e) => e.cardId === CardIds.AvianaElunesChosen_MoonCycleEnchantmentToken_EDR_895t)
				.flatMap((e) => e?.tags?.find((e) => e.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value ?? 0)
				.reduce((a, b) => a + b, 0) ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.aviana-elunes-chosen-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.aviana-elunes-chosen-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override formatValue(value: number | null | undefined): null | undefined | number | string {
		return `${value} / 3`;
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side].value(gameState);
		const tooltip = this.i18n.translateString(`counters.aviana-elunes-chosen.${side}`, {
			value: 1,
			turns: `${value}`,
		});
		return tooltip;
	}
}
