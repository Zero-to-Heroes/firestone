/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

export class TalyaEarthstriderGlobalAuraCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'talyaEarthstriderGlobalAura';
	public override image = CardIds.TalyaEarthstrider_MEND_304;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.TalyaEarthstrider_MEND_304 as CardIds];

	readonly player = {
		pref: 'playerTalyaEarthstriderGlobalAuraCounter' as const,
		display: (state: GameState): boolean =>
			state.playerDeck.powerTriggeredThisMatch.filter((p) => p.cardId === CardIds.TalyaEarthstrider_MEND_304)
				.length > 0,
		value: (state: GameState): number | null => {
			return state.playerDeck.powerTriggeredThisMatch.filter(
				(p) => p.cardId === CardIds.TalyaEarthstrider_MEND_304,
			).length;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.talya-earthstrider-global-aura-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.talya-earthstrider-global-aura-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentTalyaEarthstriderGlobalAuraCounter' as const,
		display: (state: GameState): boolean =>
			state.opponentDeck.powerTriggeredThisMatch.filter((p) => p.cardId === CardIds.TalyaEarthstrider_MEND_304)
				.length > 0,
		value: (state: GameState): number | null => {
			return state.opponentDeck.powerTriggeredThisMatch.filter(
				(p) => p.cardId === CardIds.TalyaEarthstrider_MEND_304,
			).length;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.talya-earthstrider-global-aura-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.talya-earthstrider-global-aura-tooltip'),
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
		return this.i18n.translateString(`counters.talya-earthstrider-global-aura.${side}`, { value });
	}
}
