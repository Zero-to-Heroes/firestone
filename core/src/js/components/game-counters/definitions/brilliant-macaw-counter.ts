import { CardIds } from '@firestone-hs/reference-data';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { GameState } from '../../../models/decktracker/game-state';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BrilliantMacawCounterDefinition implements CounterDefinition {
	readonly type = 'brilliantMacaw';
	readonly value: number | string;
	readonly valueImg: string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(
		gameState: GameState,
		side: string,
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): BrilliantMacawCounterDefinition {
		console.debug('building def for macaw', gameState);
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		console.debug('getting last battlecry', deck);
		const lastBattlecry: DeckCard = deck.lastBattlecryPlayedForMacaw(allCards);
		if (!lastBattlecry) {
			return null;
		}
		console.debug('got last battlecry', lastBattlecry);
		const tooltip = i18n.translateString(`decktracker.counter.brilliant-macaw.${side}`, {
			value: lastBattlecry.cardName,
		});
		return {
			type: 'brilliantMacaw',
			value: null,
			valueImg: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.BrilliantMacaw}.jpg`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${lastBattlecry.cardId}.jpg`,
			cssClass: 'brilliant-macaw-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
