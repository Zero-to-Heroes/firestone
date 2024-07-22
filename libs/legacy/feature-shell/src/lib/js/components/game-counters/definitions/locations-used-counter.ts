import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '@firestone/game-state';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class LocationsUsedCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'locationsUsed';
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
	): LocationsUsedCounterDefinition {
		return new LocationsUsedCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.locationsUsed;
	}

	public emit(locationsUsed: number): NonFunctionProperties<LocationsUsedCounterDefinition> {
		const tooltip = this.i18n.translateString(`counters.locations-used.${this.side}`, {
			value: locationsUsed,
		});
		return {
			type: 'locationsUsed',
			value: locationsUsed,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.SeasideGiant_VAC_439}.jpg`,
			cssClass: 'locations-used-counter',
			tooltip: tooltip,
			standardCounter: true,
		};
	}
}
