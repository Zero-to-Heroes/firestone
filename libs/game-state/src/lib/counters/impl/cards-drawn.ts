import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { initialHeroClassIs } from '../../models/hero-card';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class CardsDrawnCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'cardsDrawn';
	public override image = CardIds.PlayhouseGiant_TOY_530;
	public override cards: readonly CardIds[] = [CardIds.PlayhouseGiant_TOY_530];

	readonly player = {
		pref: 'playerCardsDrawnCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number => state.playerDeck?.cardDrawnThisGame,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.cards-drawn-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.cards-drawn-tooltip', {
					cardName: allCards.getCard(CardIds.PlayhouseGiant_TOY_530)?.name,
				}),
		},
	};

	readonly opponent = {
		pref: 'opponentCardsDrawnCounter' as const,
		display: (state: GameState): boolean => initialHeroClassIs(state.opponentDeck?.hero, [CardClass.ROGUE]),
		value: (state: GameState): number => state.opponentDeck?.cardDrawnThisGame,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.cards-drawn-label'),
			tooltip: (i18n: ILocalizationService, allCards: CardsFacadeService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.cards-drawn-tooltip', {
					cardName: allCards.getCard(CardIds.PlayhouseGiant_TOY_530)?.name,
					cardClass: i18n.translateString(`global.card-class.${CardClass[CardClass.ROGUE].toLowerCase()}`),
				}),
		},
	};

	constructor(private readonly i18n: ILocalizationService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		return this.i18n.translateString(`counters.cards-drawn.${side}`, {
			value: side === 'player' ? this.player.value(gameState) : this.opponent.value(gameState),
		});
	}
}
