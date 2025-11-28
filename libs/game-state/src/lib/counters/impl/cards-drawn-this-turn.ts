import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { initialHeroClassIs } from '../../models/hero-card';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class CardsDrawnThisTurnCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'cardsDrawnThisTurn';
	public override image = CardIds.EverythingMustGo_TOY_519;
	public override cards: readonly CardIds[] = [CardIds.EverythingMustGo_TOY_519];

	readonly player = {
		pref: 'playerCardsDrawnThisTurnCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.playerDeck?.cardsDrawnByTurn.find((t) => t.turn === (state.currentTurn as number))?.value ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.cards-drawn-this-turn-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.cards-drawn-this-turn-tooltip'),
		},
	};

	readonly opponent = {
		pref: 'opponentCardsDrawnThisTurnCounter' as const,
		display: (state: GameState): boolean =>
			initialHeroClassIs(state.opponentDeck?.hero, [CardClass.ROGUE]) &&
			state.opponentDeck.hasRelevantCard([CardIds.EverythingMustGo_TOY_519]),
		value: (state: GameState): number =>
			state.opponentDeck?.cardsDrawnByTurn.find((t) => t.turn === (state.currentTurn as number))?.value ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.cards-drawn-this-turn-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.cards-drawn-this-turn-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.cards-drawn-this-turn.${side}`, {
			value: side === 'player' ? this.player.value(gameState) : this.opponent.value(gameState),
		});
	}
}
