import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class RelicCounterDefinition implements CounterDefinition {
	readonly type = 'relic';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(gameState: GameState, side: string, i18n: LocalizationFacadeService): RelicCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const relicsPlayed = deck.relicsPlayedThisMatch || 0;
		return {
			type: 'relic',
			value: relicsPlayed,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.RelicOfDimensions}.jpg`,
			cssClass: 'relic-counter',
			tooltip: i18n.translateString(`counters.relic.${side}`, { value: relicsPlayed + 1 }),
			standardCounter: true,
		};
	}
}
