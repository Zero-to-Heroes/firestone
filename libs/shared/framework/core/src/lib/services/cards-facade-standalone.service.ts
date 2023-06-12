import { Injectable } from '@angular/core';
import { AllCardsService, ReferenceCard } from '@firestone-hs/reference-data';
import { sleep } from '@firestone/shared/framework/common';

@Injectable()
export class CardsFacadeStandaloneService {
	private service: AllCardsService;

	public async init(service: AllCardsService, locale: string) {
		this.service = service;
		await this.setLocale(locale);
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

	public async setLocale(locale: string) {
		console.log('setting locale', locale);
		const fileName = this.getFileName(locale);
		console.log('initializing cards db with', fileName);
		await this.service.initializeCardsDb(undefined, fileName);
		console.log('cards initialized', this.service.getCards()[0]);
	}

	// We keep this synchronous because we ensure, in the game init pipeline, that loading cards
	// is the first thing we do
	public getCard(id: string | number): ReferenceCard {
		return this.service?.getCard(id);
	}

	public getCardFromDbfId(dbfId: number): ReferenceCard {
		return this.service?.getCardFromDbfId(dbfId);
	}

	public getCardsFromDbfIds(dbfIds: number[]): ReferenceCard[] {
		return this.service?.getCardsFromDbfIds(dbfIds);
	}

	public getCards(): ReferenceCard[] {
		return this.service?.getCards();
	}

	public getService() {
		return this.service;
	}

	private getFileName(locale: string) {
		return `cards_${locale}.gz.json`;
	}
}
