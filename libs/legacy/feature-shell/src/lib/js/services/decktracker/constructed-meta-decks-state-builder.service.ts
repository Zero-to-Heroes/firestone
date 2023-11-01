import { Injectable } from '@angular/core';
import {
	ArchetypeStat,
	ArchetypeStats,
	DeckStat,
	DeckStats,
	GameFormat,
	RankBracket,
	TimePeriod,
} from '@firestone-hs/constructed-deck-stats';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { ApiRunner } from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

const CONSTRUCTED_META_DECKS_BASE_URL = 'https://static.zerotoheroes.com/api/constructed/stats/decks';
const CONSTRUCTED_META_DECK_DETAILS_URL = 'https://xcwdxyfpo2hfj2inn25rh5gd3y0rdwyw.lambda-url.us-west-2.on.aws/';
const CONSTRUCTED_META_ARCHETYPES_BASE_URL = 'https://static.zerotoheroes.com/api/constructed/stats/archetypes';

@Injectable()
export class ConstructedMetaDecksStateService {
	public constructedMetaDecks$$ = new SubscriberAwareBehaviorSubject<DeckStats>(null);
	public currentConstructedMetaDeck$$ = new BehaviorSubject<DeckStat>(null);
	public constructedMetaArchetypes$$ = new SubscriberAwareBehaviorSubject<ArchetypeStats>(null);
	public currentConstructedMetaArchetype$$ = new BehaviorSubject<ArchetypeStat>(null);

	private triggerLoadDecks$$ = new BehaviorSubject<boolean>(false);
	private triggerLoadArchetypes$$ = new BehaviorSubject<boolean>(false);

	constructor(private readonly api: ApiRunner, private readonly store: AppUiStoreFacadeService) {
		window['constructedMetaDecks'] = this;
		this.init();
	}

	private async init() {
		await this.store.initComplete();

		this.constructedMetaDecks$$.onFirstSubscribe(async () => {
			this.triggerLoadDecks$$.next(true);
		});
		this.constructedMetaArchetypes$$.onFirstSubscribe(async () => {
			this.triggerLoadArchetypes$$.next(true);
		});

		combineLatest([
			this.triggerLoadDecks$$,
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
				this.constructedMetaDecks$$.next(null);
				const stats = await this.loadNewDecks(formatFilter, timeFilter, rankFilter);
				this.constructedMetaDecks$$.next(stats);
			});
		combineLatest([
			this.store.listen$(([main, nav]) => nav.navigationDecktracker.selectedConstructedMetaDeck),
			this.store.listenPrefs$(
				(prefs) => prefs.constructedMetaDecksRankFilter2,
				(prefs) => prefs.constructedMetaDecksTimeFilter,
				(prefs) => prefs.constructedMetaDecksFormatFilter,
			),
		])
			.pipe(
				filter(
					([deckstring, [rankFilter, timeFilter, formatFilter]]) =>
						!!timeFilter && !!formatFilter && !!rankFilter,
				),
			)
			.subscribe(async ([[deckstring], [rankFilter, timeFilter, formatFilter]]) => {
				this.currentConstructedMetaDeck$$.next(null);
				if (deckstring?.length) {
					const deck = await this.loadNewDeckDetails(deckstring, formatFilter, timeFilter, rankFilter);
					this.currentConstructedMetaDeck$$.next(deck);
				}
			});

		combineLatest([
			this.triggerLoadArchetypes$$,
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
				this.constructedMetaArchetypes$$.next(null);
				const stats = await this.loadNewArchetypes(formatFilter, timeFilter, rankFilter);
				this.constructedMetaArchetypes$$.next(stats);
			});
		combineLatest([
			this.store.listen$(([main, nav]) => nav.navigationDecktracker.selectedConstructedMetaArchetype),
			this.store.listenPrefs$(
				(prefs) => prefs.constructedMetaDecksRankFilter2,
				(prefs) => prefs.constructedMetaDecksTimeFilter,
				(prefs) => prefs.constructedMetaDecksFormatFilter,
			),
		])
			.pipe(
				filter(
					([archetypeId, [rankFilter, timeFilter, formatFilter]]) =>
						!!timeFilter && !!formatFilter && !!rankFilter,
				),
			)
			.subscribe(async ([[archetypeId], [rankFilter, timeFilter, formatFilter]]) => {
				this.currentConstructedMetaArchetype$$.next(null);
				if (archetypeId > 0) {
					const deck = await this.loadNewArchetypeDetails(archetypeId, formatFilter, timeFilter, rankFilter);
					this.currentConstructedMetaArchetype$$.next(deck);
				}
			});
	}

	private async loadNewDecks(format: GameFormat, time: TimePeriod, rank: RankBracket): Promise<DeckStats> {
		const fileName = `${format}/${rank}/${time}/overview.gz.json`;
		const url = `${CONSTRUCTED_META_DECKS_BASE_URL}/${fileName}`;
		console.log('[constructed-meta-decks] will load deck stats', url, format, time, rank);
		const resultStr = await this.api.get(url);
		if (!resultStr?.length) {
			console.error('could not load meta decks', format, time, rank, url);
			return null;
		}

		const stats: DeckStats = JSON.parse(resultStr);
		console.log('[constructed-meta-decks] loaded meta decks', format, time, rank, stats?.dataPoints);
		return stats;
	}

	private async loadNewDeckDetails(
		deckstring: string,
		format: GameFormat,
		time: TimePeriod,
		rank: RankBracket,
	): Promise<DeckStat> {
		const deckId = encodeURIComponent(deckstring.replace('/', '-'));
		const fileName = `${format}/${rank}/${time}/${deckId}`;
		const url = `${CONSTRUCTED_META_DECK_DETAILS_URL}/${fileName}`;
		console.log('[constructed-meta-decks] will load stat for deck', url, format, time, rank, deckstring);
		const resultStr = await this.api.get(url);
		if (!resultStr?.length) {
			console.error('could not load meta decks', format, time, rank, url);
			return null;
		}

		const deck: DeckStat = JSON.parse(resultStr);
		console.debug('[constructed-meta-decks] loaded deck', format, time, rank, deck?.totalGames);
		return deck;
	}

	private async loadNewArchetypes(format: GameFormat, time: TimePeriod, rank: RankBracket): Promise<ArchetypeStats> {
		const fileName = `${format}/${rank}/${time}/overview.gz.json`;
		const url = `${CONSTRUCTED_META_ARCHETYPES_BASE_URL}/${fileName}`;
		console.log('[constructed-meta-decks] will load archetype stats', url, format, time, rank);
		const resultStr = await this.api.get(url);
		if (!resultStr?.length) {
			console.error('could not load meta decks', format, time, rank, url);
			return null;
		}

		const stats: ArchetypeStats = JSON.parse(resultStr);
		console.log('[constructed-meta-decks] loaded meta archetypes', format, time, rank, stats?.dataPoints);
		return stats;
	}

	private async loadNewArchetypeDetails(
		archetypeId: number,
		format: GameFormat,
		time: TimePeriod,
		rank: RankBracket,
	): Promise<ArchetypeStat> {
		const fileName = `${format}/${rank}/${time}/archetype/${archetypeId}.gz.json`;
		const url = `${CONSTRUCTED_META_ARCHETYPES_BASE_URL}/${fileName}`;
		console.log('[constructed-meta-decks] will load stat for archetype', url, format, time, rank, archetypeId);
		const resultStr = await this.api.get(url);
		if (!resultStr?.length) {
			console.error('could not load meta archetypes', format, time, rank, url);
			return null;
		}

		const deck: ArchetypeStat = JSON.parse(resultStr);
		console.debug('[constructed-meta-decks] loaded archetype', format, time, rank, deck?.totalGames);
		return deck;
	}
}
