import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class AnachronosCounterDefinition implements CounterDefinition {
	readonly type = 'anachronos';
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
	): AnachronosCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const lastAnachronosTurn = deck.anachronosTurnsPlayed[deck.anachronosTurnsPlayed.length - 1];
		if (!lastAnachronosTurn) {
			return null;
		}

		const delta = 4 - (gameState.gameTagTurnNumber - lastAnachronosTurn);
		if (delta <= 0) {
			return null;
		}

		const value = Math.ceil(delta / 2);
		return {
			type: 'anachronos',
			value: value,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Anachronos}.jpg`,
			cssClass: 'anachronos-counter',
			tooltip: i18n.translateString(`counters.anachronos.${side}`, { value: value }),
			cardTooltips: null,
			standardCounter: true,
		};
	}
}
