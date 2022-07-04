import { EventEmitter, Injectable } from '@angular/core';
import { DataForRank, DeckStat } from '@firestone-hs/deck-stats';
import { ApiRunner } from '../api-runner';
import { LocalStorageService } from '../local-storage';
import { ConstructedMetaDecksLoadedEvent } from '../mainwindow/store/events/decktracker/constructed-meta-decks-loaded-event';
import { MainWindowStoreEvent } from '../mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';

const CONSTRUCTED_META_DECKS_BASE_URL = 'https://static.zerotoheroes.com/api/ranked/decks';

@Injectable()
export class ConstructedMetaDecksStateBuilderService {
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly localStorage: LocalStorageService,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly api: ApiRunner,
	) {
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async init() {
		const localMetaDecks = this.localStorage.getItem<readonly DeckStat[]>('constructed-meta-decks');
		if (!!localMetaDecks?.length) {
			console.debug('loaded local meta decks', localMetaDecks);
			this.stateUpdater.next(new ConstructedMetaDecksLoadedEvent(localMetaDecks));
		}

		// Load the real info
		const prefs = await this.prefs.getPreferences();
		const format = prefs.constructedMetaDecksFormatFilter;
		const time = prefs.constructedMetaDecksTimeFilter;
		const rank = prefs.constructedMetaDecksRankFilter;
		const fileName = `ranked-decks-${format}-${time}-${rank}.gz.json`;
		const url = `${CONSTRUCTED_META_DECKS_BASE_URL}/${fileName}`;
		const resultStr = await this.api.get(url);
		if (!resultStr?.length) {
			console.error('could not load meta decks', format, time, rank, url);
			return;
		}
		const json: DataForRank = JSON.parse(resultStr);
		const decks: readonly DeckStat[] = json.deckStats;
		console.log('loaded meta decks', format, time, rank, decks?.length);
		console.debug('loaded meta decks', format, time, rank, decks);
		this.localStorage.setItem('constructed-meta-decks', decks);
		this.stateUpdater.next(new ConstructedMetaDecksLoadedEvent(decks));
	}
}
