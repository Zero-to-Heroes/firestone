import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class FatigueCounterDefinition implements CounterDefinition {
	readonly type = 'fatigue';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string, i18n: LocalizationFacadeService): FatigueCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		// Next fatigue damage
		const fatigue = deck.fatigue+1 || 0;
		return {
			type: 'fatigue',
			value: fatigue,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/FATIGUE.jpg`,
			cssClass: 'fatigue-counter',
			tooltip: i18n.translateString(`counters.fatigue.${side}`, { value: fatigue }),
			standardCounter: true,
		};
	}
}
