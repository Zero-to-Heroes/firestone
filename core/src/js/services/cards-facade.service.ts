import { Injectable } from '@angular/core';
import { AllCardsService, ReferenceCard } from '@firestone-hs/reference-data';
import { OverwolfService } from './overwolf.service';

@Injectable()
export class CardsFacadeService {
	private readonly service: AllCardsService;

	constructor(private readonly ow: OverwolfService) {
		this.service = this.ow?.getMainWindow()?.cards;
		if (!this.service && this.ow) {
			console.error('cards service should have been initialized', new Error().stack);
		}
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
