import { CardIds, GameFormat } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class CeaselessExpanseCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'ceaselessExpanse';
	public override image = CardIds.TheCeaselessExpanse_GDB_142;
	public override cards: readonly CardIds[] = [CardIds.TheCeaselessExpanse_GDB_142];
	protected override singleton = true;

	readonly player = {
		pref: 'playerCeaselessExpanseCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number => this.getValue(state),
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.ceaseless-expanse-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.ceaseless-expanse-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentCeaselessExpanseCounter' as const,
		display: (state: GameState): boolean => state.metadata?.formatType !== GameFormat.FT_TWIST,
		value: (state: GameState): number => this.getValue(state),
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

	protected override tooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		allCards: CardsFacadeService,
	): string | null {
		const value = this.player.value(gameState);
		return this.i18n.translateString(`counters.ceaseless.player`, {
			value: value,
			cardName: allCards.getCard(CardIds.TheCeaselessExpanse_GDB_142).name,
			cost: Math.max(0, (allCards.getCard(CardIds.TheCeaselessExpanse_GDB_142).cost ?? 100) - value),
		});
	}

	private getValue(state: GameState): number {
		return (
			state.playerDeck.cardDrawnThisGame +
			state.opponentDeck.cardDrawnThisGame +
			state.miscCardsDestroyed.length +
			state.playerDeck.cardsPlayedThisMatch.length +
			state.opponentDeck.cardsPlayedThisMatch.length +
			state.playerDeck.minionsDeadThisMatch.length +
			state.opponentDeck.minionsDeadThisMatch.length +
			state.playerDeck.destroyedCardsInDeck.length +
			state.opponentDeck.destroyedCardsInDeck.length
			// Tested this, and it looks like Ceaseless doesn't get discounted when drawing cards with
			// my hand full
			// + state.playerDeck.burnedCards.length +
			// state.opponentDeck.burnedCards.length
		);
	}
}
