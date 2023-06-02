import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class PogoCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'pogo';
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
	): PogoCounterDefinition {
		return new PogoCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.pogoHopperSize ?? 0;
	}

	public emit(pogoHopperSize: number): NonFunctionProperties<PogoCounterDefinition> {
		return {
			type: 'pogo',
			value: pogoHopperSize,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.PogoHopper_BOT_283}.jpg`,
			cssClass: 'pogo-counter',
			tooltip: this.i18n.translateString(`counters.pogo.${this.side}`, { value: pogoHopperSize }),
			standardCounter: true,
		};
	}
}
