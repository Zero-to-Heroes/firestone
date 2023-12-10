import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class ChaoticTendrilCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'chaoticTendril';
	readonly value: number | string;
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
	): ChaoticTendrilCounterDefinition {
		return new ChaoticTendrilCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.chaoticTendrilsPlayedThisMatch ?? 0;
	}

	public emit(chaoticTendrilsPlayed: number): NonFunctionProperties<ChaoticTendrilCounterDefinition> {
		return {
			type: 'chaoticTendril',
			value: chaoticTendrilsPlayed,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.ChaoticTendril_YOG_514}.jpg`,
			cssClass: 'pogo-counter',
			tooltip: this.i18n.translateString(`counters.specific-plays.${this.side}`, {
				value: chaoticTendrilsPlayed,
				cardName: this.allCards.getCard(CardIds.ChaoticTendril_YOG_514).name,
			}),
			standardCounter: true,
		};
	}
}
