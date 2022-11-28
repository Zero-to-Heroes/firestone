import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class SpectralPillagerCounterDefinition implements CounterDefinition {
	readonly type = 'spectralPillager';
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
	): SpectralPillagerCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const cardsPlayedThisTurn = deck.cardsPlayedThisTurn.length;
		return {
			type: 'spectralPillager',
			value: cardsPlayedThisTurn,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.SpectralPillager}.jpg`,
			cssClass: 'spectral-pillager-counter',
			tooltip: null,
			cardTooltips: null,
			standardCounter: true,
		};
	}
}
