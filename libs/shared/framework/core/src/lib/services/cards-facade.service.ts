import { Injectable } from '@angular/core';
import { AllCardsService, ReferenceCard } from '@firestone-hs/reference-data';
import { sleep } from '@firestone/shared/framework/common';
import { OverwolfService } from './overwolf.service';

@Injectable()
export class CardsFacadeService {
	private service: AllCardsService;

	constructor(private readonly ow: OverwolfService) {
		this.init();
	}

	public async waitForReady(): Promise<void> {
		// eslint-disable-next-line no-async-promise-executor
		return new Promise<void>(async (resolve, reject) => {
			let retriesLeft = 50;
			while (!this.service?.getCards()?.length && retriesLeft >= 0) {
				await sleep(500);
				retriesLeft--;
			}
			if (!this.service?.getCards()?.length) {
				console.error('[cards] cards service should have been initialized', new Error().stack);
				reject();
			} else {
				resolve();
			}
		});
	}

	private async init() {
		// eslint-disable-next-line no-async-promise-executor
		return new Promise<void>(async (resolve, reject) => {
			let retriesLeft = 50;
			this.service = this.ow?.getMainWindow()?.cards;
			while (!this.service && this.ow && retriesLeft >= 0) {
				await sleep(500);
				this.service = this.ow?.getMainWindow()?.cards;
				retriesLeft--;
			}
			if (!this.service && this.ow) {
				console.error('[cards] cards service should have been initialized', new Error().stack);
				reject();
			} else {
				resolve();
			}
		});
	}

	// We keep this synchronous because we ensure, in the game init pipeline, that loading cards
	// is the first thing we do
	public getCard(id: string | number, errorWhenUndefined = true): ReferenceCard {
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
