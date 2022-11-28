import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class ElementalCounterDefinition implements CounterDefinition {
	readonly type = 'elemental';
	readonly value: number | string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string, i18n: LocalizationFacadeService): ElementalCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const elementalsPlayedThisTurn = deck.elementalsPlayedThisTurn || 0;
		const elementalsPlayedLastTurn = deck.elementalsPlayedLastTurn || 0;
		return {
			type: 'elemental',
			value: `${elementalsPlayedLastTurn}/${elementalsPlayedThisTurn}`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.GrandFinale}.jpg`,
			cssClass: 'spell-counter',
			tooltip: i18n.translateString(`counters.elemental.${side}`, {
				lastTurn: elementalsPlayedLastTurn,
				thisTurn: elementalsPlayedThisTurn,
			}),
			standardCounter: true,
		};
	}
}
