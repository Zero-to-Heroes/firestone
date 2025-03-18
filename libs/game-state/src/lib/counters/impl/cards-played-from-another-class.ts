/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { anyOverlap } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { GameState } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class CardsPlayedFromAnotherClassCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'cardsPlayedFromAnotherClass';
	public override image = CardIds.SnatchAndGrab_VAC_700;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [CardIds.SnatchAndGrab_VAC_700];

	readonly player = {
		pref: 'playerCardsPlayedFromAnotherClassCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			return (
				state.playerDeck.cardsPlayedThisMatch
					.filter(
						(c) =>
							!!this.allCards.getCard(c.cardId).classes?.length &&
							this.allCards.getCard(c.cardId).classes?.[0] !== CardClass[CardClass.NEUTRAL],
					)
					.filter(
						(c) =>
							!anyOverlap(
								this.allCards.getCard(c.cardId).classes?.map((c) => CardClass[c]) ?? [],
								state.playerDeck.hero?.classes ?? [],
							),
					).length ?? 0
			);
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.cards-played-from-another-class-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.cards-played-from-another-class-tooltip'),
		},
	};
	readonly opponent = undefined;

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.cards-played-from-another-class.${side}`, {
			value: value,
		});
	}
}
