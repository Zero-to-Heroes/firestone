import { InjectionToken } from '@angular/core';

export const CARDS_HIGHLIGHT_SERVICE_TOKEN = new InjectionToken<ICardsHighlightService>('CardsHighlightService');
export interface ICardsHighlightService {
	init(options?: any /*SelectorOptions */);
	initForDuels();
	register(_uniqueId: string, handler: any /*Handler*/, side: 'player' | 'opponent' | 'duels');
	unregister(_uniqueId: string, side: 'player' | 'opponent' | 'duels');
	onMouseEnter(cardId: string, side: 'player' | 'opponent' | 'duels', card?: any /*DeckCard*/);
	getHighlightedCards(
		cardId: string,
		side: 'player' | 'opponent' | 'duels',
		card?: any /*DeckCard*/,
	): readonly { cardId: string; playTiming: number }[];
	onMouseLeave(cardId: string);
}
