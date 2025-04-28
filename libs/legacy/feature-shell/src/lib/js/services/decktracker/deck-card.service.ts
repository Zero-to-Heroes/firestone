import { Injectable } from '@angular/core';
import { DeckState, Metadata } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '../localization-facade.service';

@Injectable()
export class DeckCardService {
	constructor(private allCards: CardsFacadeService, private readonly i18n: LocalizationFacadeService) {}

	// Doesn't handle dynamic zones, so should be called before dynamic zones are built
	public fillMissingCardInfoInDeck(deckState: DeckState, metaData: Metadata): DeckState {
		return deckState;
	}
}
