import { Injectable } from '@angular/core';
import { CardIds, ReferenceCard } from '@firestone-hs/reference-data';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { PreferencesService } from '../../preferences.service';

@Injectable()
export class CardsHighlightService {
	private handlers: { [uniqueId: string]: Handler } = {};

	constructor(private readonly prefs: PreferencesService) {}

	register(_uniqueId: string, handler: Handler) {
		this.handlers[_uniqueId] = handler;
	}

	unregister(_uniqueId: string) {
		delete this.handlers[_uniqueId];
	}

	async onMouseEnter(cardId: string) {
		const prefs = await this.prefs.getPreferences();
		if (!prefs.overlayHighlightRelatedCards) {
			return;
		}

		const selector: (handler: Handler) => boolean = this.buildSelector(cardId);
		if (selector) {
			Object.values(this.handlers)
				.filter((handler) => selector(handler))
				.forEach((handler) => handler.highlightCallback());
		}
	}

	onMouseLeave(cardId: string) {
		Object.values(this.handlers).forEach((handler) => handler.unhighlightCallback());
	}

	private buildSelector(cardId: string): (handler: Handler) => boolean {
		switch (cardId) {
			case CardIds.Collectible.Demonhunter.DoubleJump:
				return (handler: Handler) => {
					return (
						handler.zoneProvider()?.id === 'deck' &&
						(handler.referenceCardProvider()?.mechanics ?? []).includes('OUTCAST')
					);
				};
		}
	}
}

export interface Handler {
	readonly referenceCardProvider: () => ReferenceCard;
	readonly deckCardProvider: () => VisualDeckCard;
	readonly zoneProvider: () => DeckZone;
	readonly highlightCallback: () => void;
	readonly unhighlightCallback: () => void;
}
