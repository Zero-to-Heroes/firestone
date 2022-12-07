import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BonelordFrostwhisperCounterDefinition implements CounterDefinition {
	readonly type = 'bonelordFrostwhisper';
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
	): BonelordFrostwhisperCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const firstBonelordTurn = deck.bonelordFrostwhisperFirstTurnTrigger;
		if (!firstBonelordTurn) {
			return null;
		}

		const delta = 6 - (gameState.gameTagTurnNumber - firstBonelordTurn);
		if (delta <= 0) {
			return null;
		}

		const value = Math.ceil(delta / 2);
		return {
			type: 'bonelordFrostwhisper',
			value: value,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.BonelordFrostwhisper}.jpg`,
			cssClass: 'bonelord-frostwhisper-counter',
			tooltip: i18n.translateString(`counters.bonelord-frostwhisper.${side}`, { value: value }),
			cardTooltips: null,
			standardCounter: true,
		};
	}
}
