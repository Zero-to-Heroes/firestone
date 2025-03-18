/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class TyrandeCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'tyrande';
	public override image = CardIds.Tyrande_EDR_464;
	public override cards: readonly CardIds[] = [CardIds.Tyrande_EDR_464] as any[];

	readonly player = {
		pref: 'playerTyrandeCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.playerDeck.enchantments
				.filter((e) => e.cardId === CardIds.Tyrande_PullOfTheMoonEnchantment_EDR_464e2)
				.flatMap((e) => e?.tags?.find((e) => e.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value ?? 0)
				.reduce((a, b) => a + b, 0) ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.tyrande-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.tyrande-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentTyrandeCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.opponentDeck.enchantments
				.filter((e) => e.cardId === CardIds.Tyrande_PullOfTheMoonEnchantment_EDR_464e2)
				.flatMap((e) => e?.tags?.find((e) => e.Name === GameTag.TAG_SCRIPT_DATA_NUM_1)?.Value ?? 0)
				.reduce((a, b) => a + b, 0) ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.tyrande-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.tyrande-tooltip'),
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
		const tooltip = this.i18n.translateString(`counters.tyrande.${side}`, {
			value: `${value}`,
		});
		return tooltip;
	}
}
