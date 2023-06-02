import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { sumOnArray } from '@services/utils';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class AbyssalCurseCounterDefinition
	implements CounterDefinition<GameState, { abyssalCurseHighestValue: number; hand: readonly DeckCard[] }>
{
	readonly type = 'abyssalCurse';
	readonly value: number | string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): AbyssalCurseCounterDefinition {
		return new AbyssalCurseCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): { abyssalCurseHighestValue: number; hand: readonly DeckCard[] } {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return {
			abyssalCurseHighestValue: deck.abyssalCurseHighestValue ?? 0,
			hand: deck.hand,
		};
	}

	public emit(info: {
		abyssalCurseHighestValue: number;
		hand: readonly DeckCard[];
	}): NonFunctionProperties<AbyssalCurseCounterDefinition> {
		const lastCurseDamage = info.abyssalCurseHighestValue ?? 0;
		const totalDamageFromCursesInHand = sumOnArray(
			info.hand.filter((c) => c.cardId == CardIds.SirakessCultist_AbyssalCurseToken),
			(c) => c.mainAttributeChange + 1,
		);
		return {
			type: 'abyssalCurse',
			value: `${lastCurseDamage}/${totalDamageFromCursesInHand}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.SirakessCultist_AbyssalCurseToken}.jpg`,
			cssClass: 'abyssal-curse-counter',
			tooltip: this.i18n.translateString(`counters.abyssal-curse-2.${this.side}`, {
				value: lastCurseDamage,
				totalDamageFromCursesInHand: totalDamageFromCursesInHand,
			}),
			standardCounter: true,
		};
	}
}
