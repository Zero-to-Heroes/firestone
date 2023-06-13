import { CardClass, CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState, ShortCard } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class LightrayCounterDefinition implements CounterDefinition<GameState, readonly ShortCard[]> {
	readonly type = 'lightray';
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
	): LightrayCounterDefinition {
		return new LightrayCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly ShortCard[] {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.cardsPlayedThisMatch;
	}

	public emit(cardsPlayedThisMatch: readonly ShortCard[]): NonFunctionProperties<LightrayCounterDefinition> {
		const paladinCardsPlayed = cardsPlayedThisMatch
			.map((c) => this.allCards.getCard(c.cardId))
			.filter((c) => c?.classes.includes(CardClass[CardClass.PALADIN])).length;
		const tooltip = this.i18n.translateString(`counters.lightray.${this.side}`, {
			value: paladinCardsPlayed,
			lightray: Math.max(0, this.allCards.getCard(CardIds.Lightray).cost - paladinCardsPlayed),
		});
		return {
			type: 'lightray',
			value: paladinCardsPlayed,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Lightray}.jpg`,
			cssClass: 'vanessa-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
