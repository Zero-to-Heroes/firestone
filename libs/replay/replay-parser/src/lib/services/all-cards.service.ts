import { Injectable } from '@angular/core';
import { AllCardsService as BaseService, ReferenceCard } from '@firestone-hs/reference-data';

// Here to act as cache
@Injectable({
	providedIn: 'root',
})
export class AllCardsService {
	public service: BaseService;

	constructor() {
		this.service = new BaseService();
		// We don't call it in the constructor because we want the app to be in control
		// of how they load the cards, and for it to be aware of when cards have been loaded
		// this.retrieveAllCards();
	}

	// We keep this synchronous because we ensure, in the game init pipeline, that loading cards
	// is the first thing we do
	public getCard(id: string, errorWhenUndefined = true): ReferenceCard {
		return this.service.getCard(id, errorWhenUndefined);
	}

	public getCardFromDbfId(dbfId: number): ReferenceCard {
		return this.service.getCardFromDbfId(dbfId);
	}

	public getCardsFromDbfIds(dbfIds: number[]): ReferenceCard[] {
		return this.service.getCardsFromDbfIds(dbfIds);
	}

	public getCards(): ReferenceCard[] {
		return this.service.getCards();
	}

	public async initializeCardsDb(version?: string): Promise<void> {
		return this.service.initializeCardsDb(version);
	}
}
