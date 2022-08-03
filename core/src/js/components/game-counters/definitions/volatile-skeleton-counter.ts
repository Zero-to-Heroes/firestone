import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class VolatileSkeletonCounterDefinition implements CounterDefinition {
	readonly type = 'volatileSkeleton';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(
		gameState: GameState,
		side: string,
		i18n: LocalizationFacadeService,
	): VolatileSkeletonCounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const skeletonDeaths = deck.volatileSkeletonsDeadThisMatch || 0;
		return {
			type: 'volatileSkeleton',
			value: skeletonDeaths,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.VolatileSkeleton}.jpg`,
			cssClass: 'volatile-skeleton-counter',
			tooltip: i18n.translateString(`counters.volatile-skeleton.${side}`, { value: skeletonDeaths }),
			standardCounter: true,
		};
	}
}
