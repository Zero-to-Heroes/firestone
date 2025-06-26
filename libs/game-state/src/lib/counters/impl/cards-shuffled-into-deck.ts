/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { initialHeroClassIs } from '../../models/hero-card';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class CardsShuffledIntoDeckCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'cardsShuffledIntoDeck';
	public override image = CardIds.Knockback_TLC_517;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		CardIds.Knockback_TLC_517,
		CardIds.UnderbrushTracker_TLC_520,
		CardIds.LieInWait_TLC_513,
	];

	readonly player = {
		pref: 'playerCardsShuffledIntoDeckCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return state.playerDeck.cardsShuffledIntoDeck ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.cards-shuffled-into-your-deck-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.cards-shuffled-into-your-deck-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentCardsShuffledIntoDeckCounter_' as const,
		display: (state: GameState): boolean => {
			if (!initialHeroClassIs(state.opponentDeck.hero, [CardClass.ROGUE])) {
				return false;
			}

			return true;
		},
		value: (state: GameState) => {
			return state.opponentDeck.cardsShuffledIntoDeck ?? 0;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.cards-shuffled-into-your-deck-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.cards-shuffled-into-your-deck-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.cards-shuffled-into-your-deck.${side}`, { value: value });
	}
}
