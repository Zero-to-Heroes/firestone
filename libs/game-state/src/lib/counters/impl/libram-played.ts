/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class LibramPlayedCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'libram';
	public override image = CardIds.LibramOfWisdom_BT_025;
	public override cards: readonly CardIds[] = [CardIds.LadyLiadrin, CardIds.LadyLiadrin_CORE_BT_334];

	readonly player = {
		pref: 'playerLibramCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			console.debug('getting player libram counter', state.playerDeck.libramsPlayedThisMatch);
			return state.playerDeck.libramsPlayedThisMatch ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.libram-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.libram-tooltip'),
		},
	};
	readonly opponent = undefined; /*{
		pref: 'opponentLibramCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.opponentDeck.libramsPlayedThisMatch ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.libram-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.libram-tooltip'),
		},
	};*/

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this.player.value(gameState)!;
		return this.i18n.translateString(`counters.libram.${side}`, { value: value });
	}
}
