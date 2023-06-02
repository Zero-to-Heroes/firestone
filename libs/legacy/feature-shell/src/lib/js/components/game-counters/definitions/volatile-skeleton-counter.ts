import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class VolatileSkeletonCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'volatileSkeleton';
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
	): VolatileSkeletonCounterDefinition {
		return new VolatileSkeletonCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.volatileSkeletonsDeadThisMatch ?? 0;
	}

	public emit(skeletonDeaths: number): NonFunctionProperties<VolatileSkeletonCounterDefinition> {
		return {
			type: 'volatileSkeleton',
			value: skeletonDeaths,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.VolatileSkeleton}.jpg`,
			cssClass: 'volatile-skeleton-counter',
			tooltip: this.i18n.translateString(`counters.volatile-skeleton.${this.side}`, { value: skeletonDeaths }),
			standardCounter: true,
		};
	}
}
