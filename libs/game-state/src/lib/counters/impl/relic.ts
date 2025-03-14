/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, RELIC_IDS } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class RelicCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'relic';
	public override image = CardIds.RelicOfDimensions;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		CardIds.ArtificerXymox_REV_787,
		CardIds.ArtificerXymox_REV_937,
		CardIds.ArtificerXymox_ArtificerXymoxToken,
		...RELIC_IDS,
	];

	readonly player = {
		pref: 'playerRelicCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.playerDeck.relicsPlayedThisMatch ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.relic-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.relic-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentRelicCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.opponentDeck.relicsPlayedThisMatch ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.relic-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.relic-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.relic.${side}`, { value: value + 1 });
	}
}
