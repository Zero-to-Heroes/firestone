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
			console.log('already in init');
			return;
		}

		this.inInit = true;
		await this.cards.initializeCardsDb(CARDS_VERSION);
		window['cards'] = this.cards;
	}
}
