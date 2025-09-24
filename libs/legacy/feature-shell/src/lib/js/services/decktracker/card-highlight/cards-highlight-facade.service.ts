import { Injectable } from '@angular/core';
import { HighlightSide, ICardsHighlightService, OverwolfService } from '@firestone/shared/framework/core';

import { GameType } from '@firestone-hs/reference-data';
import { DeckCard } from '@firestone/game-state';
import { sleep } from '@firestone/shared/framework/common';
import { CardsHighlightService } from '@services/decktracker/card-highlight/cards-highlight.service';
import { Handler, SelectorOptions } from './cards-highlight-common.service';

@Injectable()
export class CardsHighlightFacadeService implements ICardsHighlightService {
	private service: CardsHighlightService;

	constructor(private readonly ow: OverwolfService) {
		return;
		this.initService();
	}

	private async initService() {
		const mainWindow = this.ow.getMainWindow();
		console.log('[cards-highlight-facade] mainWindow', mainWindow);
		while (!this.service) {
			this.service = mainWindow.cardsHighlightService;
			await sleep(500);
		}
	}

	public async init(options?: SelectorOptions) {
		return;
		this.service.init(options);
	}

	public async initForSingle() {
		return;
		this.service.init({
			skipGameState: true,
			skipPrefs: true,
			uniqueZone: true,
		});
	}
	public forceHeroCardId(cardId: string) {
		return;
		this.service.forceHeroCardId(cardId);
	}

	register(_uniqueId: string, handler: Handler, side: HighlightSide) {
		return;
		this.service.register(_uniqueId, handler, side);
	}

	unregister(_uniqueId: string, side: HighlightSide) {
		return;
		this.service.unregister(_uniqueId, side);
	}

	async onMouseEnter(cardId: string, side: HighlightSide, card?: DeckCard, context?: 'discover') {
		return;
		this.service.onMouseEnter(cardId, side, card, context);
	}

	getHighlightedCards(
		cardId: string,
		side: HighlightSide,
		card?: DeckCard,
	): readonly { cardId: string; playTiming: number }[] {
		return;
		return this.service.getHighlightedCards(cardId, side, card);
	}

	getCardsForTooltip(
		cardId: string,
		side: HighlightSide,
		card?: DeckCard,
	): readonly { cardId: string; playTiming: number }[] {
		return;
		return this.service.getHighlightedCards(cardId, side, card).filter((c) => c.highlight === 'tooltip');
	}

	getGlobalRelatedCards(
		entityId,
		cardId: string,
		side: HighlightSide,
		gameTypeOverride: GameType = null,
	): readonly string[] {
		return;
		return this.service.getGlobalRelatedCards(entityId, cardId, side, gameTypeOverride);
	}

	onMouseLeave(cardId: string) {
		return;
		this.service.onMouseLeave(cardId);
	}
}
