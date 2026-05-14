import { CardIds, GameTag } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../counter-type';

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
		value: (state: GameState): number | null => {
			const n =
				state.opponentDeck.cardsPlayedThisMatch?.filter((c) =>
					this.allCards.getCard(c.cardId).mechanics?.includes(GameTag[GameTag.OVERLOAD]),
				)?.length ?? 0;
			return n > 0 ? n : null;
		},
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

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.overload-cards-played.${side}`, { value: value });
	}
}
