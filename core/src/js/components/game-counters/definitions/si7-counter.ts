import { CardIds } from '@firestone-hs/reference-data';
import { GameState } from '../../../models/decktracker/game-state';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { CounterDefinition } from './_counter-definition';

export class Si7CounterDefinition implements CounterDefinition {
	readonly type = 'si7Counter';
	readonly value: number;
	readonly image: string;
	readonly cssClass: string;
	readonly tooltip: string;
	readonly standardCounter = true;

	static create(
		gameState: GameState,
		side: string,
		allCards: CardsFacadeService,
		i18n: LocalizationFacadeService,
	): Si7CounterDefinition {
		const deck = side === 'player' ? gameState.playerDeck : gameState.opponentDeck;
		if (!deck) {
			return null;
		}

		const correctSi7Locale = getSi7Locale(i18n.formatCurrentLocale());
		const si7CardsPlayed = gameState.cardsPlayedThisMatch
			.filter((c) => c.side === side)
			.filter((c) => allCards.getCard(c.cardId).name?.toLowerCase()?.includes(correctSi7Locale.toLowerCase()));
		return {
			type: 'si7Counter',
			value: si7CardsPlayed.length,
			image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${CardIds.Si7Smuggler}.jpg`,
			cssClass: 'si-7-counter',
			tooltip: i18n.translateString(`counters.si-seven.${side}`, { value: si7CardsPlayed.length }),
			standardCounter: true,
		};
	}
}

const getSi7Locale = (locale: string): string => {
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
