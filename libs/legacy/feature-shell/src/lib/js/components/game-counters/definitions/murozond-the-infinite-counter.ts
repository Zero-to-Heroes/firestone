import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class MurozondTheInfiniteCounterDefinition implements CounterDefinition {
	readonly type = 'murozondTheInfinite';
	readonly value: number | string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly cardTooltips?: readonly string[];
	readonly standardCounter = true;

	static create(
		gameState: GameState,
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): MurozondTheInfiniteCounterDefinition {
		const counterOwnerDeck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		const otherDeck = side === 'player' ? gameState.opponentDeck : gameState.playerDeck;
		if (!counterOwnerDeck || !otherDeck) {
			return null;
		}

		const cards = otherDeck.isActivePlayer ? otherDeck.cardsPlayedThisTurn : otherDeck.cardsPlayedLastTurn;
		const cardsPlayedLastTurn: readonly string[] = cards?.map((c) => c.cardId);
		return {
			type: 'murozondTheInfinite',
			value: null,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.MurozondTheInfinite}.jpg`,
			cssClass: 'murozond-counter',
			tooltip: null,
			cardTooltips: cardsPlayedLastTurn,
			standardCounter: true,
		};
	}
}
