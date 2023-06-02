import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class LibramCounterDefinition implements CounterDefinition<GameState, number> {
	readonly type = 'libram';
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
	): LibramCounterDefinition {
		return new LibramCounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): number {
		const deck = this.side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		return deck.libramsPlayedThisMatch ?? 0;
	}

	public emit(libramsPlayedThisMatch: number): NonFunctionProperties<LibramCounterDefinition> {
		return {
			type: 'libram',
			value: libramsPlayedThisMatch,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.LibramOfWisdom_BT_025}.jpg`,
			cssClass: 'watchpost',
			tooltip: this.i18n.translateString(`counters.libram.${this.side}`, { value: libramsPlayedThisMatch }),
			standardCounter: true,
		};
	}
}
