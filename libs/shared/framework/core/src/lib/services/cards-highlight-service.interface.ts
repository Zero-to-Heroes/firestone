import { InjectionToken } from '@angular/core';

export const CARDS_HIGHLIGHT_SERVICE_TOKEN = new InjectionToken<ICardsHighlightService>('CardsHighlightService');
export interface ICardsHighlightService {
	init(options?: any /*SelectorOptions */);
	initForSingle();
	register(_uniqueId: string, handler: any /*Handler*/, side: 'player' | 'opponent' | 'single');
	unregister(_uniqueId: string, side: 'player' | 'opponent' | 'single');
	onMouseEnter(cardId: string, side: 'player' | 'opponent' | 'single', card?: any /*DeckCard*/);
	getHighlightedCards(
		cardId: string,
		side: 'player' | 'opponent' | 'single',
		card?: any /*DeckCard*/,
	): readonly { cardId: string; playTiming: number }[];
	onMouseLeave(cardId: string);
	getCardsForTooltip(
		cardId: string,
		side: 'player' | 'opponent' | 'single',
		card?: any /*DeckCard*/,
	): readonly { cardId: string; playTiming: number }[];
}
