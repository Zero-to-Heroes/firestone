import { CardIds } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class DiscoversCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'discovers';
	public override image = CardIds.AlienEncounters_GDB_237;
	protected override cards: readonly CardIds[] = [CardIds.AlienEncounters_GDB_237];

	readonly player = {
		pref: 'playerDiscoversCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number => state.playerDeck?.discoversThisGame,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.discovers-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.discovers-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentDiscoversCounter' as const,
		display: (state: GameState): boolean => state.opponentDeck.hasRelevantCard(this.cards),
		value: (state: GameState): number => state.playerDeck?.discoversThisGame,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.discovers-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.discovers-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.discovers.${side}`, {
			value: side === 'player' ? this.player.value(gameState) : this.opponent.value(gameState),
		});
	}
}
