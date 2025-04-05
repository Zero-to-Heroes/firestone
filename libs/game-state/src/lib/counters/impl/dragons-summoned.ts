import { CardClass, CardIds, GameFormat } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { initialHeroClassIs } from '../../models/hero-card';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class DragonsSummonedCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'dragonsSummoned';
	public override image = CardIds.FyeTheSettingSun_WW_825;
	public override cards: readonly CardIds[] = [CardIds.FyeTheSettingSun_WW_825];

	readonly player = {
		pref: 'playerDragonsSummonedCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number => state.playerDeck?.dragonsSummoned,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dragons-summoned-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dragons-summoned-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentDragonsSummonedCounter' as const,
		display: (state: GameState): boolean =>
			state.metadata?.formatType === GameFormat.FT_WILD &&
			initialHeroClassIs(state.opponentDeck?.hero, [CardClass.DRUID]),
		value: (state: GameState): number => state.opponentDeck?.dragonsSummoned,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.dragons-summoned-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.dragons-summoned-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.specific-summons.${side}`, {
			value: side === 'player' ? this.player.value(gameState) : this.opponent.value(gameState),
			cardName: this.i18n.translateString('global.tribe.dragon'),
		});
	}
}
