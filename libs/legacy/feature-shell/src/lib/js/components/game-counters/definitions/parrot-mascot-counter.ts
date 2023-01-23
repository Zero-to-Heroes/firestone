import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class ParrotMascotCounterDefinition implements CounterDefinition {
	readonly type = 'parrotMascot';
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
	): ParrotMascotCounterDefinition {
		const counterOwnerDeck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!counterOwnerDeck) {
			return null;
		}

		const cards = counterOwnerDeck.cardsPlayedThisTurn.map((c) => c.cardId);
		return {
			type: 'parrotMascot',
			value: null,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.ParrotMascot}.jpg`,
			cssClass: 'parrot-mascot-counter',
			tooltip: null,
			cardTooltips: cards,
			standardCounter: true,
		};
	}
}
