import { CardIds, Race } from '@firestone-hs/reference-data';
import { GameState, ShortCardWithTurn } from '@firestone/game-state';
import { NonFunctionProperties, groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class ElementalStreakCounterDefinition
	implements CounterDefinition<GameState, { currentTurn: number; cards: readonly ShortCardWithTurn[] }>
{
	readonly type = 'elementalStreak';
	readonly value: number | string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly cardTooltips?: readonly string[];
	readonly standardCounter = true;

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): ElementalStreakCounterDefinition {
		return new ElementalStreakCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): { currentTurn: number; cards: readonly ShortCardWithTurn[] } {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const currentTurn = +gameState.currentTurn;
		return { currentTurn: currentTurn, cards: deck.cardsPlayedThisMatch };
	}

	public emit(input: {
		currentTurn: number;
		cards: readonly ShortCardWithTurn[];
	}): NonFunctionProperties<ElementalStreakCounterDefinition> {
		const groupedByTurn = groupByFunction((card: ShortCardWithTurn) => card.turn)(input.cards);
		const lastTurn = input.currentTurn;
		let elementalStreak = 0;
		for (let i = lastTurn; i > 0; i--) {
			const elementals = groupedByTurn[i]?.filter(
				(card) =>
					this.allCards.getCard(card.cardId).races?.includes(Race[Race.ELEMENTAL]) ||
					this.allCards.getCard(card.cardId).races?.includes(Race[Race.ALL]),
			);
			if (!elementals?.length && i !== lastTurn) {
				break;
			} else if (elementals?.length) {
				elementalStreak++;
			}
		}
		const tooltip = this.i18n.translateString(`counters.elemental-streak.${this.side}`, {
			value: elementalStreak,
		});
		return {
			type: 'elementalStreak',
			value: elementalStreak,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.AzeriteGiant_WW_025}.jpg`,
			cssClass: 'elemental-streak-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
