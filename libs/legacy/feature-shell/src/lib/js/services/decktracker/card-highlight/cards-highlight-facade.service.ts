import { Injectable } from '@angular/core';
import { OverwolfService } from '@firestone/shared/framework/core';
import {
	CardsHighlightService,
	Handler,
	SelectorOptions,
} from '@services/decktracker/card-highlight/cards-highlight.service';
import { DeckCard } from '../../../models/decktracker/deck-card';

@Injectable()
export class CardsHighlightFacadeService {
	private service: CardsHighlightService;

	constructor(private readonly ow: OverwolfService) {
		this.service = ow.getMainWindow().cardsHighlightService;
	}

	public async init(options?: SelectorOptions) {
		this.service.init(options);
	}

	public async initForDuels() {
		this.service.init({
			skipGameState: true,
			skipPrefs: true,
			uniqueZone: true,
		});
	}

	register(_uniqueId: string, handler: Handler, side: 'player' | 'opponent' | 'duels') {
		this.service.register(_uniqueId, handler, side);
	}

	unregister(_uniqueId: string, side: 'player' | 'opponent' | 'duels') {
		this.service.unregister(_uniqueId, side);
	}

	async onMouseEnter(cardId: string, side: 'player' | 'opponent' | 'duels', card?: DeckCard) {
		this.service.onMouseEnter(cardId, side, card);
	}

	getHighlightedCards(
		cardId: string,
		side: 'player' | 'opponent' | 'duels',
		card?: DeckCard,
	): readonly { cardId: string; playTiming: number }[] {
		return this.service.getHighlightedCards(cardId, side, card);
	}

	onMouseLeave(cardId: string) {
		this.service.onMouseLeave(cardId);
	}
}
