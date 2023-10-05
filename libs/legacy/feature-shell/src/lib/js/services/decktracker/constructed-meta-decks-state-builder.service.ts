import { Injectable } from '@angular/core';
import { DeckStats, GameFormat, RankBracket, TimePeriod } from '@firestone-hs/constructed-deck-stats';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { ApiRunner } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

const CONSTRUCTED_META_DECKS_BASE_URL = 'https://static.zerotoheroes.com/api/constructed/stats/decks';

@Injectable()
export class ConstructedMetaDecksStateService {
	public constructedMetaDecks$$ = new SubscriberAwareBehaviorSubject<DeckStats>(null);

	private triggerLoad$$ = new BehaviorSubject<boolean>(false);

	constructor(
		// private readonly localStorage: LocalStorageService,
		private readonly api: ApiRunner,
		private readonly store: AppUiStoreFacadeService,
	) {
		window['constructedMetaDecks'] = this;
		this.init();
	}

	private async init() {
		await this.store.initComplete();

		this.constructedMetaDecks$$.onFirstSubscribe(async () => {
			this.triggerLoad$$.next(true);
		});

		combineLatest([
			this.triggerLoad$$,
			this.store.listenPrefs$(
				(prefs) => prefs.constructedMetaDecksRankFilter2,
				(prefs) => prefs.constructedMetaDecksTimeFilter,
				(prefs) => prefs.constructedMetaDecksFormatFilter,
			),
		])
			.pipe(
				filter(
					([triggerLoad, [rankFilter, timeFilter, formatFilter]]) =>
						triggerLoad && !!timeFilter && !!formatFilter && !!rankFilter,
				),
			)
			.subscribe(async ([_, [rankFilter, timeFilter, formatFilter]]) => {
				// const localStats: DeckStats = this.localStorage.getItem<DeckStats>(
				// 	LocalStorageService.CONSTRUCTED_META_DECK_STATS,
				// );
				// if (localStats?.dataPoints) {
				// 	// this.constructedMetaDecks$$.next(localStats);
				// }
				this.constructedMetaDecks$$.next(null);
				const stats = await this.loadNewDecks(formatFilter, timeFilter, rankFilter);
				this.constructedMetaDecks$$.next(stats);
			});
	}

	public async loadNewDecks(format: GameFormat, time: TimePeriod, rank: RankBracket): Promise<DeckStats> {
		const fileName = `${format}/${time}/${rank}.gz.json`;
		const url = `${CONSTRUCTED_META_DECKS_BASE_URL}/${fileName}`;
		console.log('[constructed-meta-decks] will load real stats', url, format, time, rank);
		const resultStr = await this.api.get(url);
		if (!resultStr?.length) {
			console.error('could not load meta decks', format, time, rank, url);
			return null;
		}

		const stats: DeckStats = JSON.parse(resultStr);
		console.log('[constructed-meta-decks] loaded meta decks', format, time, rank, stats?.dataPoints);
		// this.localStorage.setItem(LocalStorageService.CONSTRUCTED_META_DECK_STATS, stats);
		return stats;
	}
}
