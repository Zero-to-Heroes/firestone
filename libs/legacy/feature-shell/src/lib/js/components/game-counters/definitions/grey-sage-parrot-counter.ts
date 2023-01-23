import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class GreySageParrotCounterDefinition implements CounterDefinition {
	readonly type = 'greySageParrot';
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
	): GreySageParrotCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const costThreshold = 5;
		const candidate: ReferenceCard = gameState
			.getSpellsPlayedForPlayer(allCards, side)
			.map((cardId) => allCards.getCard(cardId))
			.filter((card) => card.cost >= costThreshold)
			.pop();
		if (!candidate?.id) {
			return null;
		}
		const tooltip = i18n.translateString(`counters.grey-sage-parrot.${side}`, {
			value: candidate.name,
			cost: costThreshold,
		});
		return {
			type: 'greySageParrot',
			value: null,
			valueImg: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.GreySageParrot}.jpg`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${candidate.id}.jpg`,
			cssClass: 'grey-sage-parrot-counter',
			tooltip: tooltip,
			cardTooltips: [candidate.id],
			standardCounter: true,
		};
	}
}
