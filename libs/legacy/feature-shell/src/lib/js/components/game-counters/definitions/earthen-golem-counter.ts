import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class EarthenGolemCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'earthenGolem';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
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
	): EarthenGolemCounterDefinition {
		return new EarthenGolemCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.earthenGolemSize ?? 0;
	}

	public emit(earthenGolemSize: number): NonFunctionProperties<EarthenGolemCounterDefinition> {
		return {
			type: 'earthenGolem',
			value: earthenGolemSize,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.StoneheartKing_EarthenGolemToken}.jpg`,
			cssClass: 'pogo-counter',
			tooltip: this.i18n.translateString(`counters.specific-summons.${this.side}`, {
				value: earthenGolemSize,
				cardName: this.allCards.getCard(CardIds.StoneheartKing_EarthenGolemToken).name,
			}),
			standardCounter: true,
		};
	}
}
