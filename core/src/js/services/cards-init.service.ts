import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { CARDS_VERSION } from './hs-utils';

@Injectable()
export class CardsInitService {
	private inInit = false;

	constructor(private readonly cards: AllCardsService) {
		// this.init();
	}

	public async init() {
		console.debug('starting init', new Error().stack);
		if (this.inInit) {
			console.log('already in init', new Error().stack);
			return;
		}

		this.inInit = true;
		await this.cards.initializeCardsDb(CARDS_VERSION);
		window['cards'] = this.cards;
	}
}
