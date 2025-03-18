/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { CardIds, Race } from '@firestone-hs/reference-data';
import { groupByFunction2 } from '@firestone/shared/framework/common';
import { CardsFacadeService, ILocalizationService } from '@firestone/shared/framework/core';
import { DeckState } from '../../models/deck-state';
import { GameState, ShortCardWithTurn } from '../../models/game-state';
import { CounterDefinitionV2 } from '../_counter-definition-v2';
import { CounterType } from '../_exports';

export class ElementalStreakCounterDefinitionV2 extends CounterDefinitionV2<number> {
	public override id: CounterType = 'elementalStreak';
	public override image = CardIds.SkarrTheCatastrophe_WW_026;
	public override type: 'hearthstone' | 'battlegrounds' = 'hearthstone';
	public override cards: readonly CardIds[] = [
		CardIds.AzeriteGiant_WW_025,
		CardIds.SkarrTheCatastrophe_WW_026,
		CardIds.OverflowSurger_WW_424,
	];

	readonly player = {
		pref: 'playerElementalStreakCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			const elementalStreak = buildValue(state.playerDeck, +state.currentTurn, this.allCards);
			return elementalStreak;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.elemental-streak-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.elemental-streak-tooltip'),
		},
	};
	readonly opponent = {
		pref: 'opponentElementalStreakCounter' as const,
		display: (state: GameState): boolean => true,
		value: (state: GameState) => {
			const elementalStreak = buildValue(state.opponentDeck, +state.currentTurn, this.allCards);
			return elementalStreak >= 2 ? elementalStreak : null;
		},
		setting: {
			label: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.your-deck.counters.elemental-streak-label'),
			tooltip: (i18n: ILocalizationService): string =>
				i18n.translateString('settings.decktracker.opponent-deck.counters.elemental-streak-tooltip'),
		},
	};

	constructor(private readonly i18n: ILocalizationService, private readonly allCards: CardsFacadeService) {
		super();
	}

	protected override tooltip(side: 'player' | 'opponent', gameState: GameState): string {
		const value = this[side]?.value(gameState) ?? 0;
		return this.i18n.translateString(`counters.elemental-streak.${side}`, {
			value: value,
		});
	}
}

const buildValue = (deck: DeckState, lastTurn: number, allCards: CardsFacadeService): number => {
	const groupedByTurn = groupByFunction2(deck.cardsPlayedThisMatch, (card: ShortCardWithTurn) => card.turn);
	let elementalStreak = 0;
	for (let i = lastTurn; i > 0; i--) {
		const elementals = groupedByTurn[i]?.filter(
			(card) =>
				allCards.getCard(card.cardId).races?.includes(Race[Race.ELEMENTAL]) ||
				allCards.getCard(card.cardId).races?.includes(Race[Race.ALL]),
		);
		if (!elementals?.length && i !== lastTurn) {
			break;
		} else if (elementals?.length) {
			elementalStreak++;
		}
	}
	return elementalStreak;
};
