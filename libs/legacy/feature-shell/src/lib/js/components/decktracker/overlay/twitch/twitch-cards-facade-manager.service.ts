import { Injectable } from '@angular/core';
import { AllCardsService } from '@firestone-hs/reference-data';
import { sleep } from '@firestone/shared/framework/common';
import { CardsFacadeStandaloneService } from '@firestone/shared/framework/core';
import { TwitchPreferencesService } from '@firestone/twitch/common';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

@Injectable()
export class TwitchCardsFacadeManagerService {
	constructor(
		private readonly prefs: TwitchPreferencesService,
		private readonly allCards: CardsFacadeStandaloneService,
	) {
		this.init();
	}

	public async isReady() {
		while (!this.allCards.getService()?.getCards()?.length) {
			await sleep(200);
			console.log('waiting for cards to be ready');
		}
		console.log('cards are ready');
	}

	private init() {
		this.prefs.preferences$$
			.pipe(
				debounceTime(200),
				distinctUntilChanged(),
				map((prefs) => prefs.locale),
				distinctUntilChanged(),
			)
			.subscribe(async (locale) => {
				console.debug('setting locale for cards', locale);
				await this.allCards.init(new AllCardsService(), locale);
				console.debug('cards init done');
				// this.allCards.setLocale(locale);
			});
	}
}
