import { CardClass, CardIds, CardType, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '../../models/_barrel';
import { GameState } from '../../models/game-state';
import { filterCards, hasCost, hasCorrectType, canBeDiscoveredByClass } from '../../related-cards/dynamic-pools';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class OverloadCardsPlayedCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'overloadCardsPlayed';
	public override image = CardIds.ChargedCall;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	// Charged Call: Discover a 1-Cost minion and summon it. (Upgraded for each Overload card you played this game!)
	public override cards: readonly CardIds[] = [CardIds.ChargedCall];

	readonly player = {
		pref: 'playerOverloadCardsPlayedCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.playerDeck.cardsPlayedThisMatch?.filter((c) =>
				this.allCards.getCard(c.cardId).mechanics?.includes(GameTag[GameTag.OVERLOAD]),
			)?.length ?? 0,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.overload-cards-played-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.overload-cards-played-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentOverloadCardsPlayedCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState): number =>
			state.opponentDeck.cardsPlayedThisMatch?.filter((c) =>
				this.allCards.getCard(c.cardId).mechanics?.includes(GameTag[GameTag.OVERLOAD]),
			)?.length ?? null,
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.overload-cards-played-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.overload-cards-played-tooltip'),
		},
	};

	constructor(
		private readonly i18n: ILocalizationService,
		protected override readonly allCards: CardsFacadeService,
	) {
		super(allCards);
	}

	protected override cardTooltip(
		side: 'player' | 'opponent',
		gameState: GameState,
		bgState: BattlegroundsState,
		value: number | null | undefined,
	): readonly string[] | undefined {
		const overloadCount = value ?? 0;
		const targetCost = 1 + overloadCount;
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const heroClass = deck?.hero?.classes?.[0];
		const currentClass = heroClass ? CardClass[heroClass] : '';
		return filterCards(
			this.allCards.getService(),
			{
				format: gameState.metadata.formatType,
				gameType: gameState.metadata.gameType,
				scenarioId: gameState.metadata.scenarioId,
				currentClass: currentClass,
				validArenaPool: [],
			},
			CardIds.ChargedCall,
			(c) =>
				hasCorrectType(c, CardType.MINION) &&
				hasCost(c, '==', targetCost) &&
				canBeDiscoveredByClass(c, currentClass),
		);
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.overload-cards-played.${side}`, { value: value });
	}
}
