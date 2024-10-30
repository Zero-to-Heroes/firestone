import { CardIds } from '@firestone-hs/reference-data';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class CeaselessExpanseCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'ceaselessExpanse';
	public override image = CardIds.TheCeaselessExpanse_GDB_142;
	protected override cards: readonly CardIds[] = [CardIds.TheCeaselessExpanse_GDB_142];

	readonly player = {
		pref: 'playerCeaselessExpanseCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.playerDeck.cardDrawnThisGame +
			state.opponentDeck.cardDrawnThisGame +
			state.cardsPlayedThisMatch.length +
			state.miscCardsDestroyed.length +
			state.playerDeck.minionsDeadThisMatch.length +
			state.opponentDeck.minionsDeadThisMatch.length,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.ceaseless-expanse-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.ceaseless-expanse-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentCeaselessExpanseCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.playerDeck.cardDrawnThisGame +
			state.opponentDeck.cardDrawnThisGame +
			state.cardsPlayedThisMatch.length +
			state.miscCardsDestroyed.length +
			state.playerDeck.minionsDeadThisMatch.length +
			state.opponentDeck.minionsDeadThisMatch.length,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.ceaseless-expanse-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.ceaseless-expanse-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string | null {
		return null;
	}
}
