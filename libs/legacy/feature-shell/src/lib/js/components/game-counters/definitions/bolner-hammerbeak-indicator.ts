import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { GameState } from '../../../models/decktracker/game-state';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BolnerHammerbeakIndicator implements CounterDefinition {
	readonly type = 'bolner';
	readonly value: number;
	readonly valueImg: string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;
	readonly cardTooltips?: readonly string[];

	static create(
		gameState: GameState,
		side: string,
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): BolnerHammerbeakIndicator {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const firstBattlecry: DeckCard = deck.firstBattlecryPlayedThisTurn(allCards);
		if (!firstBattlecry) {
			return null;
		}

		return {
			type: 'bolner',
			value: null,
			valueImg: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.BolnerHammerbeak}.jpg`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${firstBattlecry.cardId}.jpg`,
			cssClass: 'bolner-counter',
			tooltip: i18n.translateString(`counters.bolner`, { value: i18n.getCardName(firstBattlecry.cardId) }),
			cardTooltips: [firstBattlecry.cardId],
			standardCounter: true,
		};
	}
}
