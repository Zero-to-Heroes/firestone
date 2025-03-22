import { CardIds } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class LibramReductionCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'libramReduction';
	public override image = CardIds.InterstellarWayfarer_GDB_721;
	public override cards: readonly CardIds[] = [
		CardIds.LibramOfWisdom_BT_025,
		CardIds.LibramOfClarity_GDB_137,
		CardIds.LibramOfDivinity_GDB_138,
		CardIds.LibramOfJustice_BT_011,
		CardIds.LibramOfFaith_GDB_139,
		CardIds.LibramOfJudgment,
		CardIds.LibramOfHope,
	];

	readonly player = {
		pref: 'playerLibramReductionCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.playerDeck.enchantments.filter(
				(e) =>
					e.cardId === CardIds.InterstellarStarslicer_InterstellarLibramEnchantment_GDB_726e ||
					e.cardId === CardIds.AldorAttendant_AldorAttendantEnchantment,
			).length +
			2 *
				state.playerDeck.enchantments.filter(
					(e) => e.cardId === CardIds.AldorTruthseeker_AldorTruthseekerEnchantment,
				).length,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.libram-reduction-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.libram-reduction-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentLibramReductionCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.opponentDeck.enchantments.filter(
				(e) =>
					e.cardId === CardIds.InterstellarStarslicer_InterstellarLibramEnchantment_GDB_726e ||
					e.cardId === CardIds.AldorAttendant_AldorAttendantEnchantment,
			).length +
			2 *
				state.opponentDeck.enchantments.filter(
					(e) => e.cardId === CardIds.AldorTruthseeker_AldorTruthseekerEnchantment,
				).length,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.libram-reduction-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.libram-reduction-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string | null {
		const value = this[side].value(gameState);
		return this.i18n.translateString(`counters.libram-reduction.${side}`, {
			value: value,
		});
	}
}
