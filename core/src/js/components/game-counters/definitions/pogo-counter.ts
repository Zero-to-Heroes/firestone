import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class PogoCounterDefinition implements CounterDefinition {
	readonly type = 'pogo';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string, i18n: LocalizationFacadeService): PogoCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const pogoHopperSize = deck.pogoHopperSize || 0;
		return {
			type: 'pogo',
			value: pogoHopperSize,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.PogoHopper1}.jpg`,
			cssClass: 'pogo-counter',
			tooltip: i18n.translateString(`counters.pogo.${side}`, { value: pogoHopperSize }),
			standardCounter: true,
		};
	}
}
