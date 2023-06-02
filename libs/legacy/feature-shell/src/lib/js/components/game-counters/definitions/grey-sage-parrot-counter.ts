import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState, ShortCard } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class GreySageParrotCounterDefinition implements CounterDefinition<GameState, readonly ShortCard[]> {
	readonly type = 'greySageParrot';
	readonly value: number | string;
	readonly valueImg: string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;
	readonly cardTooltips?: readonly string[];

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): GreySageParrotCounterDefinition {
		return new GreySageParrotCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly ShortCard[] {
		return gameState.cardsPlayedThisMatch;
	}

	public emit(cardsPlayedThisMatch: readonly ShortCard[]): NonFunctionProperties<GreySageParrotCounterDefinition> {
		const costThreshold = 6;
		const candidate: ReferenceCard = cardsPlayedThisMatch
			.filter((card) => card.side === this.side)
			.map((card) => this.allCards.getCard(card.cardId))
			.filter((card) => card.type?.toLowerCase() === 'spell')
			.filter((card) => card.cost >= costThreshold)
			.pop();
		if (!candidate?.id) {
			return null;
		}
		const tooltip = this.i18n.translateString(`counters.grey-sage-parrot.${this.side}`, {
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
