import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class MonstrousParrotCounterDefinition implements CounterDefinition {
	readonly type = 'monstrousParrot';
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
	): MonstrousParrotCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const lastDeathrattleCardId: string = deck.lastDeathrattleTriggered;
		if (!lastDeathrattleCardId) {
			return null;
		}
		const tooltip = i18n.translateString(`counters.monstrous-parrot.${side}`, {
			value: allCards.getCard(lastDeathrattleCardId).name,
		});
		return {
			type: 'monstrousParrot',
			value: null,
			valueImg: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.MonstrousParrot}.jpg`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${lastDeathrattleCardId}.jpg`,
			cssClass: 'monstrous-parrot-counter',
			tooltip: tooltip,
			cardTooltips: [lastDeathrattleCardId],
			standardCounter: true,
		};
	}
}
