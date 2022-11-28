import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class ElwynnBoarCounterDefinition implements CounterDefinition {
	readonly type = 'elwynnBoar';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string, i18n: LocalizationFacadeService): ElwynnBoarCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const boarDeaths = deck.elwynnBoarsDeadThisMatch || 0;
		return {
			type: 'elwynnBoar',
			value: boarDeaths,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.ElwynnBoar}.jpg`,
			cssClass: 'elwynn-boar-counter',
			tooltip: i18n.translateString(`counters.elwynn-boar.${side}`, { value: boarDeaths }),
			standardCounter: true,
		};
	}
}
