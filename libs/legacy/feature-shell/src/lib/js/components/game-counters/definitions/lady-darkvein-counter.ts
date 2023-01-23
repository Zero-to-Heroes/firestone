import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class LadyDarkveinCounterDefinition implements CounterDefinition {
	readonly type = 'ladyDarkvein';
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
	): LadyDarkveinCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const lastShadowSpellCardId: string = gameState.lastShadowSpellPlayed(allCards, side);
		if (!lastShadowSpellCardId) {
			return null;
		}

		const tooltip = i18n.translateString(`counters.lady-darkvein.${side}`, {
			value: allCards.getCard(lastShadowSpellCardId).name,
		});
		return {
			type: 'ladyDarkvein',
			value: null,
			valueImg: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.LadyDarkvein}.jpg`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${lastShadowSpellCardId}.jpg`,
			cssClass: 'lady-darkvein-counter',
			tooltip: tooltip,
			cardTooltips: [lastShadowSpellCardId],
			standardCounter: true,
		};
	}
}
