import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class JadeCounterDefinition implements CounterDefinition {
	readonly type = 'jadeGolem';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string, i18n: LocalizationFacadeService): JadeCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const golemSize = deck.jadeGolemSize || 0;
		const cardId = CardIds.JadeGolemToken1;
		return {
			type: 'jadeGolem',
			value: golemSize,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`,
			cssClass: 'jade-counter',
			tooltip: i18n.translateString(`counters.jade.${side}`, { value: golemSize }),
			standardCounter: true,
		};
	}
}
