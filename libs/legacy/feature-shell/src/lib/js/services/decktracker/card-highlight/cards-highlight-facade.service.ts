import { Injectable } from '@angular/core';
import { ICardsHighlightService, OverwolfService } from '@firestone/shared/framework/core';

import { DeckCard } from '@firestone/game-state';
import { CardsHighlightService } from '@services/decktracker/card-highlight/cards-highlight.service';
import { Handler, SelectorOptions } from './cards-highlight-common.service';

@Injectable()
export class CardsHighlightFacadeService implements ICardsHighlightService {
	private service: CardsHighlightService;

	constructor(private readonly ow: OverwolfService) {
		this.service = ow.getMainWindow().cardsHighlightService;
	}

	public async init(options?: SelectorOptions) {
		this.service.init(options);
	}

	public async initForSingle() {
		this.service.init({
			skipGameState: true,
			skipPrefs: true,
			uniqueZone: true,
		});
	}
	public forceHeroCardId(cardId: string) {
		this.service.forceHeroCardId(cardId);
	}

	register(_uniqueId: string, handler: Handler, side: 'player' | 'opponent' | 'single') {
		this.service.register(_uniqueId, handler, side);
	}

	unregister(_uniqueId: string, side: 'player' | 'opponent' | 'single') {
		this.service.unregister(_uniqueId, side);
	}

	async onMouseEnter(cardId: string, side: 'player' | 'opponent' | 'single', card?: DeckCard, context?: 'discover') {
		this.service.onMouseEnter(cardId, side, card, context);
	}

	getHighlightedCards(
		cardId: string,
		side: 'player' | 'opponent' | 'single',
		card?: DeckCard,
	): readonly { cardId: string; playTiming: number }[] {
		return this.service.getHighlightedCards(cardId, side, card);
	}

	getCardsForTooltip(
		cardId: string,
		side: 'player' | 'opponent' | 'single',
		card?: DeckCard,
	): readonly { cardId: string; playTiming: number }[] {
		return this.service.getHighlightedCards(cardId, side, card).filter((c) => c.highlight === 'tooltip');
	}

	getGlobalRelatedCards(entityId, cardId: string, side: 'player' | 'opponent' | 'single'): readonly string[] {
		return this.service.getGlobalRelatedCards(entityId, cardId, side);
	}

	onMouseLeave(cardId: string) {
		this.service.onMouseLeave(cardId);
	}
}
