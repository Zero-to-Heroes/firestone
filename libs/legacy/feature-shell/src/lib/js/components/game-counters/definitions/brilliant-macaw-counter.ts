import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
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
	readonly cardTooltips?: readonly string[];

	static create(
		gameState: GameState,
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): BrilliantMacawCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const lastBattlecryCardId: string = gameState.lastBattlecryPlayedForMacaw(allCards, side);
		if (!lastBattlecryCardId) {
			return null;
		}
		const tooltip = i18n.translateString(`counters.brilliant-macaw.${side}`, {
			value: allCards.getCard(lastBattlecryCardId).name,
		});
		return {
			type: 'brilliantMacaw',
			value: null,
			valueImg: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.BrilliantMacaw}.jpg`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${lastBattlecryCardId}.jpg`,
			cssClass: 'brilliant-macaw-counter',
			tooltip: tooltip,
			cardTooltips: [lastBattlecryCardId],
			standardCounter: true,
		};
	}
}
