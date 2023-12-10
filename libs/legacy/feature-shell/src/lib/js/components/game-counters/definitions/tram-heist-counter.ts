import { CardIds } from '@firestone-hs/reference-data';
import { GameState, ShortCard } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class TramHeistCounterDefinition implements CounterDefinition<GameState, readonly ShortCard[]> {
	readonly type = 'tramHeist';
	readonly value: number | string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly cardTooltips?: readonly string[];
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
	): TramHeistCounterDefinition {
		return new TramHeistCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly ShortCard[] {
		const deck = this.side === 'player' ? gameState.opponentDeck : gameState.playerDeck;
		return deck.cardsPlayedLastTurn;
	}

	public emit(cardsPlayedBySide: readonly ShortCard[]): NonFunctionProperties<TramHeistCounterDefinition> {
		if (!cardsPlayedBySide?.length) {
			return null;
		}
		const lastPlayedCardIds = cardsPlayedBySide.map((card) => card.cardId);
		const tooltip = this.i18n.translateString(`counters.tram-heist.${this.side}`, {
			value: lastPlayedCardIds.length,
		});
		return {
			type: 'tramHeist',
			value: lastPlayedCardIds.length,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.TramHeist_WW_053}.jpg`,
			cssClass: 'tram-heist-counter',
			tooltip: tooltip,
			cardTooltips: lastPlayedCardIds,
			standardCounter: true,
		};
	}
}
