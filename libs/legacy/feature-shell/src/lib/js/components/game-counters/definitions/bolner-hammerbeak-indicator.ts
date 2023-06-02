import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class BolnerHammerbeakIndicator implements CounterDefinition<GameState, string> {
	readonly type = 'bolner';
	readonly value: number;
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
	): BolnerHammerbeakIndicator {
		return new BolnerHammerbeakIndicator(side, allCards, i18n);
	}

	public select(gameState: GameState): string {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.firstBattlecryPlayedThisTurn(this.allCards)?.cardId;
	}

	public emit(firstBattlecryCardId: string): NonFunctionProperties<BolnerHammerbeakIndicator> {
		return {
			type: 'bolner',
			value: null,
			valueImg: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.BolnerHammerbeak}.jpg`,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${firstBattlecryCardId}.jpg`,
			cssClass: 'bolner-counter',
			tooltip: this.i18n.translateString(`counters.bolner`, {
				value: this.i18n.getCardName(firstBattlecryCardId),
			}),
			cardTooltips: [firstBattlecryCardId],
			standardCounter: true,
		};
	}
}
