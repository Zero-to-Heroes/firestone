import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState, ShortCard } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BrilliantMacawCounterDefinition implements CounterDefinition<GameState, readonly ShortCard[]> {
	readonly type = 'brilliantMacaw';
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
	): BrilliantMacawCounterDefinition {
		return new BrilliantMacawCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly ShortCard[] {
		return gameState.cardsPlayedThisMatch;
	}

	public emit(cardsPlayedThisMatch: readonly ShortCard[]): NonFunctionProperties<BrilliantMacawCounterDefinition> {
		const lastBattlecryCardId: string = cardsPlayedThisMatch
			.filter((card) => card.side === this.side)
			.filter((card) => {
				const ref = this.allCards.getCard(card.cardId);
				return !!ref.mechanics?.length && ref.mechanics.includes('BATTLECRY');
			})
			// Because we want to know what card the macaw copies, so if we play two macaws in a row we still
			// want the info
			.filter((card) => card.cardId !== CardIds.BrilliantMacaw)
			.pop()?.cardId;
		if (!lastBattlecryCardId) {
			return null;
		}
		const tooltip = this.i18n.translateString(`counters.brilliant-macaw.${this.side}`, {
			value: this.allCards.getCard(lastBattlecryCardId).name,
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
