import { GameState } from '../../../models/decktracker/game-state';
import { getGalakrondCardFor } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class GalakrondCounterDefinition implements CounterDefinition {
	readonly type = 'galakrond';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string, i18n: LocalizationFacadeService): GalakrondCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const invokeCount = deck.galakrondInvokesCount || 0;
		const galakrondCard = getGalakrondCardFor(deck.hero?.playerClass?.toLowerCase(), invokeCount);
		return {
			type: 'galakrond',
			value: invokeCount,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${galakrondCard}.jpg`,
			cssClass: 'galakrond-counter',
			tooltip: i18n.translateString(`counters.galakrond.${side}`, { value: invokeCount }),
			standardCounter: true,
		};
	}
}
