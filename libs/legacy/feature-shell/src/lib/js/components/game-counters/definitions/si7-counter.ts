import { CardIds } from '@firestone-hs/reference-data';
import { NonFunctionProperties } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { GameState, ShortCard } from '../../../models/decktracker/game-state';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class Si7CounterDefinition implements CounterDefinition<GameState, readonly ShortCard[]> {
	readonly type = 'si7Counter';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	private readonly correctSi7Locale: string;

	constructor(
		private readonly side: 'player' | 'opponent',
		private readonly allCards,
		private readonly i18n: LocalizationFacadeService,
	) {
		this.correctSi7Locale = getSi7Locale(i18n.formatCurrentLocale());
	}

	public static create(
		side: 'player' | 'opponent',
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): Si7CounterDefinition {
		return new Si7CounterDefinition(side, allCards, i18n);
	}

	public select(gameState: GameState): readonly ShortCard[] {
		return gameState.cardsPlayedThisMatch.filter((c) => c.side === this.side);
	}

	public emit(cardsPlayedThisMatch: readonly ShortCard[]): NonFunctionProperties<Si7CounterDefinition> {
		const si7CardsPlayed = cardsPlayedThisMatch
			.filter((c) => c.side === this.side)
			.filter((c) =>
				this.allCards.getCard(c.cardId).name?.toLowerCase()?.includes(this.correctSi7Locale.toLowerCase()),
			);
		return {
			type: 'si7Counter',
			value: si7CardsPlayed.length,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Si7Smuggler}.jpg`,
			cssClass: 'si-7-counter',
			tooltip: this.i18n.translateString(`counters.si-seven.${this.side}`, { value: si7CardsPlayed.length }),
			standardCounter: true,
		};
	}
}

export const getSi7Locale = (locale: string): string => {
	switch (locale) {
		case 'esES':
		case 'esMX':
			return 'IV:7';
		case 'itIT':
			return 'IR:7';
		case 'plPL':
			return 'WW:7';
		case 'ptBR':
			return 'AVIN';
		case 'ruRU':
			return 'ШРУ';
		case 'zhCN':
			return '军情七处';
		case 'zhTW':
			return '軍情七處';
		default:
			return 'SI:7';
	}
};
