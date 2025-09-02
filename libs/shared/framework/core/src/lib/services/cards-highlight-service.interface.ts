import { InjectionToken } from '@angular/core';

export const CARDS_HIGHLIGHT_SERVICE_TOKEN = new InjectionToken<ICardsHighlightService>('CardsHighlightService');
export interface ICardsHighlightService {
	init(options?: any /*SelectorOptions */);
	initForSingle();
	register(_uniqueId: string, handler: any /*Handler*/, side: HighlightSide);
	unregister(_uniqueId: string, side: HighlightSide);
	onMouseEnter(cardId: string, side: HighlightSide, card?: any /*DeckCard*/);
	getHighlightedCards(
		cardId: string,
		side: HighlightSide,
		card?: any /*DeckCard*/,
	): readonly { cardId: string; playTiming: number }[];
	onMouseLeave(cardId: string);
	getCardsForTooltip(
		cardId: string,
		side: HighlightSide,
		card?: any /*DeckCard*/,
	): readonly { cardId: string; playTiming: number }[];
}
export type HighlightSide = 'player' | 'opponent' | 'single' | 'arena-draft';
