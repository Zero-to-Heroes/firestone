import { Injectable } from '@angular/core';
import { AllCardsService, Locale, ReferenceCard } from '@firestone-hs/reference-data';
import { CARDS_VERSION } from '../../../../services/hs-utils';

@Injectable()
export class CardsFacadeStandaloneService {
	constructor(private readonly service: AllCardsService) {
		const fileName = this.getFileName('enUS');
		console.log('initializing cards db with', fileName);
		this.service.initializeCardsDb(CARDS_VERSION, fileName);
	}

	private getFileName(locale: string) {
		return `cards_${Locale[Locale.enUS]}.json`;
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

	public getService() {
		return this.service;
	}
}
