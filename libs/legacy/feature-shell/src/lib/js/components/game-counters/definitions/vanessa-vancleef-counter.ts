import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState, ShortCard } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class VanessaVanCleefCounterDefinition implements CounterDefinition<GameState, readonly ShortCard[]> {
	readonly type = 'vanessaVanCleef';
	readonly value: number | string;
	readonly valueImg: string;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly cardTooltips?: readonly string[];
	readonly standardCounter = true;

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards,
		private readonly i18n: LocalizationFacadeService,
	) {}

	public static create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): VanessaVanCleefCounterDefinition {
		return new VanessaVanCleefCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly ShortCard[] {
		return gameState.cardsPlayedThisMatch?.filter((card) => card.side !== this.side);
	}

	public emit(cardsPlayedBySide: readonly ShortCard[]): NonFunctionProperties<VanessaVanCleefCounterDefinition> {
		const lastPlayedCard: string = !!cardsPlayedBySide?.length
			? cardsPlayedBySide[cardsPlayedBySide.length - 1]?.cardId
			: null;
		if (!lastPlayedCard) {
			return null;
		}
		const tooltip = this.i18n.translateString(`counters.vanessa.${this.side}`, {
			value: this.allCards.getCard(lastPlayedCard).name,
		});
		return {
			type: 'vanessaVanCleef',
			value: null,
			valueImg: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.VanessaVancleefLegacy}.jpg`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${lastPlayedCard}.jpg`,
			cssClass: 'vanessa-counter',
			tooltip: tooltip,
			cardTooltips: [lastPlayedCard],
			standardCounter: true,
		};
	}
}
