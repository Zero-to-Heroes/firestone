import { Injectable } from '@angular/core';
import { DataForRank, DeckStat, FormatForDeckData, RankForDeckData, TimeForDeckData } from '@firestone-hs/deck-stats';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { ApiRunner } from '../api-runner';
import { LocalStorageService } from '../local-storage';
import { ConstructedMetaDecksLoadedEvent } from '../mainwindow/store/events/decktracker/constructed-meta-decks-loaded-event';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

const CONSTRUCTED_META_DECKS_BASE_URL = 'https://static.zerotoheroes.com/api/ranked/decks';

@Injectable()
export class ConstructedMetaDecksStateBuilderService {
	private requestedInitialLoad = new BehaviorSubject<boolean>(false);

	constructor(
		private readonly localStorage: LocalStorageService,
		private readonly api: ApiRunner,
		private readonly store: AppUiStoreFacadeService,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();
		console.debug('init meta service');
		combineLatest(
			this.store.listenPrefs$(
				(prefs) => prefs.constructedMetaDecksRankFilter,
				(prefs) => prefs.constructedMetaDecksTimeFilter,
				(prefs) => prefs.constructedMetaDecksFormatFilter,
			),
			this.requestedInitialLoad.asObservable(),
		)
			.pipe(
				tap((info) => console.debug('updating meta info', info)),
				filter(([[rank, time, format], load]) => load),
				map(([[rank, time, format], load]) => ({ rank, time, format })),
			)
			.subscribe(({ rank, time, format }) => this.loadNewDecks(format, time, rank));
	}

	public async loadInitialStats() {
		const localMetaDecks = this.localStorage.getItem<readonly DeckStat[]>('constructed-meta-decks');
		if (!!localMetaDecks?.length) {
			console.debug('loaded local meta decks', localMetaDecks);
			this.store.send(new ConstructedMetaDecksLoadedEvent(localMetaDecks));
		}

		this.requestedInitialLoad.next(true);
	}

	public async loadNewDecks(format: FormatForDeckData, time: TimeForDeckData, rank: RankForDeckData) {
		console.debug('requesting new meta decks', format, time, rank);
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
		this.store.send(new ConstructedMetaDecksLoadedEvent(decks));
	}
}
