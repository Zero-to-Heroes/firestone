import { Injectable } from '@angular/core';
import { DeckCard } from '@firestone/game-state';
import { ICardsHighlightService, OverwolfService } from '@firestone/shared/framework/core';
import {
	Handler,
	SelectorOptions,
} from '@legacy-import/src/lib/js/services/decktracker/card-highlight/cards-highlight-common.service';
import { CardsHighlightStandaloneService } from './cards-highlight-standalone.service';

@Injectable()
export class TwitchCardsHighlightFacadeService implements ICardsHighlightService {
	constructor(private readonly ow: OverwolfService, private readonly service: CardsHighlightStandaloneService) {}

	public async init(options?: SelectorOptions) {
		this.service.init(options);
	}

	public async initForSingle() {
		this.service.init({
			skipGameState: true,
			skipPrefs: false,
			uniqueZone: true,
		});
	}

	register(_uniqueId: string, handler: Handler, side: 'player' | 'opponent' | 'single') {
		this.service.register(_uniqueId, handler, side);
	}

	unregister(_uniqueId: string, side: 'player' | 'opponent' | 'single') {
		this.service.unregister(_uniqueId, side);
	}

	async onMouseEnter(cardId: string, side: 'player' | 'opponent' | 'single', card?: DeckCard) {
		this.service.onMouseEnter(cardId, side, card);
	}

	getHighlightedCards(
		cardId: string,
		side: 'player' | 'opponent' | 'single',
		card?: DeckCard,
	): readonly { cardId: string; playTiming: number }[] {
		return this.service.getHighlightedCards(cardId, side, card);
	}

	onMouseLeave(cardId: string) {
		this.service.onMouseLeave(cardId);
	}

	getCardsForTooltip(
		cardId: string,
		side: 'player' | 'opponent' | 'single',
		card?: DeckCard,
	): readonly { cardId: string; playTiming: number }[] {
		return this.service.getHighlightedCards(cardId, side, card).filter((c) => c.highlight === 'tooltip');
	}
}
