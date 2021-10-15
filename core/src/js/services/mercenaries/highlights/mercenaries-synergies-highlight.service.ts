import { Injectable } from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { BehaviorSubject } from 'rxjs';
import { CardsFacadeService } from '../../cards-facade.service';
import { buildSelector } from './mercenaries-synergies-highlight-processor';

@Injectable()
export class MercenariesSynergiesHighlightService {
	private highlightSubject = new BehaviorSubject<HighlightSelector>(null);

	constructor(private readonly allCards: CardsFacadeService) {
		window['mercenariesSynergiesStore'] = this.highlightSubject;
		window['mercenariesSynergiesHighlightService'] = this;
	}

	public selectCardId(cardId: string) {
		if (!cardId) {
			return;
		}
		const selector: HighlightSelector = buildSelector(cardId, this.allCards);
		this.highlightSubject.next(selector);
	}

	public unselectCardId() {
		this.highlightSubject.next((card: ReferenceCard) => false);
	}
}

export type HighlightSelector = (card: ReferenceCard) => boolean;
