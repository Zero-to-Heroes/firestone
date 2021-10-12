import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/reference-data';
import { CARDS_VERSION } from './hs-utils';

@Injectable()
export class CardsInitService {
	private inInit = false;

	constructor(private readonly cards: AllCardsService) {}

	public async init() {
		console.debug('starting init');
		if (this.inInit) {
			console.warn('already in init');
			return;
		}

		this.inInit = true;
		await this.cards.initializeCardsDb(CARDS_VERSION, 'cards.temp.json');
		window['cards'] = this.cards;
	}
}
