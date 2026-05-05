/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class LeylineSpellEffectStrengthCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'leylineSpellEffectStrength';
	public override image = CardIds.MysticRunesaber_MEND_506;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [];

	readonly player = {
		pref: 'playerLeylineSpellEffectStrengthCounter' as const,
		display: (state: GameState): boolean => (this.player.value(state) ?? 0) > 0,
		value: (state: GameState): number | null => {
			const triggered = state.playerDeck.powerTriggeredThisMatch;
			const v =
				triggered.filter((p) => p.cardId === CardIds.MysticRunesaber_MEND_506).length +
				2 * triggered.filter((p) => p.cardId === CardIds.TheArcanomicon_EmpowerToken_MEND_505t3).length;
			return v > 0 ? v : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.leyline-spell-effect-strength-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.leyline-spell-effect-strength-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentLeylineSpellEffectStrengthCounter' as const,
		display: (state: GameState): boolean => (this.opponent.value(state) ?? 0) > 0,
		value: (state: GameState): number | null => {
			const triggered = state.opponentDeck.powerTriggeredThisMatch;
			const v =
				triggered.filter((p) => p.cardId === CardIds.MysticRunesaber_MEND_506).length +
				2 * triggered.filter((p) => p.cardId === CardIds.TheArcanomicon_EmpowerToken_MEND_505t3).length;
			return v > 0 ? v : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.leyline-spell-effect-strength-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.leyline-spell-effect-strength-tooltip'),
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
		return this.i18n.translateString(`counters.leyline-spell-effect-strength.${side}`, { value });
	}
}
