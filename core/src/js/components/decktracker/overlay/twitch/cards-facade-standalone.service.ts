import { Injectable } from '@angular/core';
import { AllCardsService, ReferenceCard } from '@firestone-hs/reference-data';
import { CARDS_VERSION } from '../../../../services/hs-utils';

@Injectable()
export class CardsFacadeStandaloneService {
	constructor(private readonly service: AllCardsService) {
		// this.setLocale('enUS');
	}

	public async setLocale(locale: string) {
		console.log('setting locale', locale);
		const fileName = this.getFileName(locale);
		console.log('initializing cards db with', fileName);
		await this.service.initializeCardsDb(CARDS_VERSION, fileName);
		console.log('cards initialized', this.service.getCards()[0]);
		this.service['debug'] = 'tretre';
		console.debug('BT_010 cards facade service', this);
	}

	// We keep this synchronous because we ensure, in the game init pipeline, that loading cards
	// is the first thing we do
	public getCard(id: string, errorWhenUndefined = true): ReferenceCard {
		console.debug('getting card', id, new Error());
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

	private getFileName(locale: string) {
		return `cards_${locale}.json`;
	}
}
