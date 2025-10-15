/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, GameFormat } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class PiratesSummonedCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'piratesSummoned';
	public override image = CardIds.PirateAdmiralHooktusk;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.PirateAdmiralHooktusk];

	readonly player = {
		pref: 'playerPiratesSummonedCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.playerDeck.piratesSummoned ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.pirates-summoned-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.pirates-summoned-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentPiratesSummonedCounter' as const,
		display: (state: GameState): boolean => state.metadata?.formatType !== GameFormat.FT_STANDARD,
		value: (state: GameState) => {
			const result = state.opponentDeck.piratesSummoned ?? 0;
			return result >= 3 ? result : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.pirates-summoned-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.pirates-summoned-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
	) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState);
		return this.i18n.translateString(`counters.specific-summons.${side}`, {
			value: value,
			cardName: this.i18n.translateString('global.tribe.pirate'),
		});
	}
}
