import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { GameState, ShortCard } from '@firestone/game-state';
import { anyOverlap, NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class CardsPlayedFromAnotherClassCounterDefinition
	implements CounterDefinition<GameState, readonly ShortCard[]>
{
	readonly type = 'cardsPlayedFromAnotherClass';
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
	): CardsPlayedFromAnotherClassCounterDefinition {
		return new CardsPlayedFromAnotherClassCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly ShortCard[] {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const cardsPlayedFromAnotherClass = deck.cardsPlayedThisMatch.filter(
			(c) =>
				!anyOverlap(
					this.allCards.getCard(c.cardId).classes?.map((c) => CardClass[c]),
					deck.hero?.classes,
				),
		);
		return cardsPlayedFromAnotherClass;
	}

	public emit(
		cardsPlayedFromAnotherClass: readonly ShortCard[],
	): NonFunctionProperties<CardsPlayedFromAnotherClassCounterDefinition> {
		const tooltip = this.i18n.translateString(`counters.cards-played-from-another-class.${this.side}`, {
			value: cardsPlayedFromAnotherClass.length,
		});
		return {
			type: 'cardsPlayedFromAnotherClass',
			value: cardsPlayedFromAnotherClass.length,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.SnatchAndGrab_VAC_700}.jpg`,
			cssClass: 'cards-played-from-another-class-counter',
			tooltip: tooltip,
			cardTooltips: cardsPlayedFromAnotherClass.map((card) => card.cardId),
			standardCounter: true,
		};
	}
}
