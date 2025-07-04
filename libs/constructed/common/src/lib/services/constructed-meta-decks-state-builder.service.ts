/* eslint-disable @typescript-eslint/member-ordering */
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
import { PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	ILocalizationService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { buildArchetypeName } from './constructed-archetype.service';
import { ConstructedNavigationService } from './constructed-navigation.service';

const CONSTRUCTED_META_DECKS_BASE_URL = 'https://static.zerotoheroes.com/api/constructed/stats/decks';
// const CONSTRUCTED_META_DECK_DETAILS_URL = 'https://xcwdxyfpo2hfj2inn25rh5gd3y0rdwyw.lambda-url.us-west-2.on.aws';
const CONSTRUCTED_META_DECK_DETAILS_URL =
	'https://fs66gthwj9.execute-api.us-west-2.amazonaws.com/prod/constructed-meta-deck?format={format}&rank={rank}&timePeriod={timePeriod}&deckId={deckId}';
const CONSTRUCTED_META_ARCHETYPES_BASE_URL = 'https://static.zerotoheroes.com/api/constructed/stats/archetypes';

@Injectable()
export class ConstructedMetaDecksStateService extends AbstractFacadeService<ConstructedMetaDecksStateService> {
	public constructedMetaDecks$$: SubscriberAwareBehaviorSubject<ExtendedDeckStats | null>;
	public currentConstructedMetaDeck$$: BehaviorSubject<DeckStat | null>;
	public constructedMetaArchetypes$$: SubscriberAwareBehaviorSubject<ArchetypeStats | null>;
	public currentConstructedMetaArchetype$$: BehaviorSubject<ArchetypeStat | null>;
	public allCardsInDeck$$: SubscriberAwareBehaviorSubject<readonly string[] | null>;
	public cardSearch$$: BehaviorSubject<readonly string[] | null>;

	private triggerLoadDecks$$ = new BehaviorSubject<boolean>(false);
	private triggerLoadArchetypes$$ = new BehaviorSubject<boolean>(false);

	private api: ApiRunner;
	private prefs: PreferencesService;
	private navigation: ConstructedNavigationService;
	private i18n: ILocalizationService;

	private deckDetailsCache: { [key: string]: DeckStat | null } = {};
	private archetypesCache: { [key: string]: ArchetypeStats | null } = {};

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'constructedMetaDecks', () => !!this.constructedMetaDecks$$);
	}

	protected override assignSubjects() {
		this.constructedMetaDecks$$ = this.mainInstance.constructedMetaDecks$$;
		this.currentConstructedMetaDeck$$ = this.mainInstance.currentConstructedMetaDeck$$;
		this.constructedMetaArchetypes$$ = this.mainInstance.constructedMetaArchetypes$$;
		this.currentConstructedMetaArchetype$$ = this.mainInstance.currentConstructedMetaArchetype$$;
		this.allCardsInDeck$$ = this.mainInstance.allCardsInDeck$$;
		this.cardSearch$$ = this.mainInstance.cardSearch$$;
	}

	protected async init() {
		this.constructedMetaDecks$$ = new SubscriberAwareBehaviorSubject<ExtendedDeckStats | null>(null);
		this.currentConstructedMetaDeck$$ = new SubscriberAwareBehaviorSubject<DeckStat | null>(null);
		this.constructedMetaArchetypes$$ = new SubscriberAwareBehaviorSubject<ArchetypeStats | null>(null);
		this.currentConstructedMetaArchetype$$ = new SubscriberAwareBehaviorSubject<ArchetypeStat | null>(null);
		this.allCardsInDeck$$ = new SubscriberAwareBehaviorSubject<readonly string[] | null>(null);
		this.cardSearch$$ = new BehaviorSubject<readonly string[] | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);
		this.navigation = AppInjector.get(ConstructedNavigationService);
		this.i18n = AppInjector.get(ILocalizationService);

		await this.navigation.isReady();
		await this.prefs.isReady();

		this.constructedMetaDecks$$.onFirstSubscribe(async () => {
			this.triggerLoadDecks$$.next(true);
			this.constructedMetaDecks$$.subscribe((decks) => this.buildAllCardsInDecks(decks));
		});
		this.constructedMetaArchetypes$$.onFirstSubscribe(async () => {
			this.triggerLoadArchetypes$$.next(true);
		});
		this.allCardsInDeck$$.onFirstSubscribe(async () => {
			this.triggerLoadDecks$$.next(true);
		});

		combineLatest([
			this.triggerLoadDecks$$,
			this.prefs.preferences$$.pipe(
				map((prefs) => ({
					rankFilter: prefs.constructedMetaDecksRankFilter2,
					timeFilter: prefs.constructedMetaDecksTimeFilter,
					formatFilter: prefs.constructedMetaDecksFormatFilter,
				})),
				distinctUntilChanged(
					(a, b) =>
						a?.rankFilter === b?.rankFilter &&
						a?.timeFilter === b?.timeFilter &&
						a?.formatFilter === b?.formatFilter,
				),
			),
		])
			.pipe(
				filter(
					([triggerLoad, { rankFilter, timeFilter, formatFilter }]) =>
						triggerLoad && !!timeFilter && !!formatFilter && !!rankFilter,
				),
			)
			.subscribe(async ([_, { rankFilter, timeFilter, formatFilter }]) => {
				this.constructedMetaDecks$$.next(null);
				const stats = await this.loadNewDecks(formatFilter, timeFilter, rankFilter);
				this.constructedMetaDecks$$.next(stats);
			});
		combineLatest([
			this.navigation.selectedConstructedMetaDeck$$,
			this.prefs.preferences$$.pipe(
				map((prefs) => ({
					rankFilter: prefs.constructedMetaDecksRankFilter2,
					timeFilter: prefs.constructedMetaDecksTimeFilter,
					formatFilter: prefs.constructedMetaDecksFormatFilter,
				})),
				distinctUntilChanged(
					(a, b) =>
						a?.formatFilter === b?.formatFilter &&
						a?.rankFilter === b?.rankFilter &&
						a?.timeFilter === b?.timeFilter,
				),
			),
		])
			.pipe(
				filter(
					([deckstring, { rankFilter, timeFilter, formatFilter }]) =>
						!!timeFilter && !!formatFilter && !!rankFilter,
				),
			)
			.subscribe(async ([deckstring, { rankFilter, timeFilter, formatFilter }]) => {
				this.currentConstructedMetaDeck$$.next(null);
				if (deckstring?.length) {
					const deck = await this.loadNewDeckDetails(deckstring, formatFilter, timeFilter, rankFilter);
					this.currentConstructedMetaDeck$$.next(deck);
				}
			});

		combineLatest([
			this.triggerLoadArchetypes$$,
			this.prefs.preferences$$.pipe(
				map((prefs) => ({
					rankFilter: prefs.constructedMetaDecksRankFilter2,
					timeFilter: prefs.constructedMetaDecksTimeFilter,
					formatFilter: prefs.constructedMetaDecksFormatFilter,
				})),
				distinctUntilChanged(
					(a, b) =>
						a?.formatFilter === b?.formatFilter &&
						a?.rankFilter === b?.rankFilter &&
						a?.timeFilter === b?.timeFilter,
				),
			),
		])
			.pipe(
				filter(
					([triggerLoad, { rankFilter, timeFilter, formatFilter }]) =>
						triggerLoad && !!timeFilter && !!formatFilter && !!rankFilter,
				),
			)
			.subscribe(async ([_, { rankFilter, timeFilter, formatFilter }]) => {
				this.constructedMetaArchetypes$$.next(null);
				const stats = await this.loadNewArchetypes(formatFilter, timeFilter, rankFilter);
				this.constructedMetaArchetypes$$.next(stats);
			});
		combineLatest([
			this.navigation.selectedConstructedMetaArchetype$$,
			this.prefs.preferences$$.pipe(
				map((prefs) => ({
					rankFilter: prefs.constructedMetaDecksRankFilter2,
					timeFilter: prefs.constructedMetaDecksTimeFilter,
					formatFilter: prefs.constructedMetaDecksFormatFilter,
				})),
				distinctUntilChanged(
					(a, b) =>
						a?.formatFilter === b?.formatFilter &&
						a?.rankFilter === b?.rankFilter &&
						a?.timeFilter === b?.timeFilter,
				),
			),
		])
			.pipe(
				filter(
					([archetypeId, { rankFilter, timeFilter, formatFilter }]) =>
						!!timeFilter && !!formatFilter && !!rankFilter,
				),
			)
			.subscribe(async ([archetypeId, { rankFilter, timeFilter, formatFilter }]) => {
				this.currentConstructedMetaArchetype$$.next(null);
				if (archetypeId != null && archetypeId > 0) {
					const deck = await this.loadNewArchetypeDetails(archetypeId, formatFilter, timeFilter, rankFilter);
					this.currentConstructedMetaArchetype$$.next(deck);
				}
			});
	}

	public newCardSearch(search: readonly string[]) {
		this.mainInstance.newCardSearchInternal(search);
	}

	private newCardSearchInternal(search: readonly string[]) {
		this.cardSearch$$.next(search);
	}

	private buildAllCardsInDecks(decks: ExtendedDeckStats | null) {
		const allCards = decks?.deckStats.flatMap((d) => d.allCardsInDeck);
		const uniqueCards = [...new Set(allCards)];
		this.allCardsInDeck$$.next(uniqueCards);
	}

	private async loadNewDecks(
		format: GameFormat,
		time: TimePeriod,
		rank: RankBracket,
	): Promise<ExtendedDeckStats | null> {
		time = (time as string) === 'all-time' ? 'past-20' : time;
		const fileName = `${format}/${rank}/${time}/overview-from-hourly.gz.json`;
		const url = `${CONSTRUCTED_META_DECKS_BASE_URL}/${fileName}`;
		console.log('[constructed-meta-decks] will load deck stats', url, format, time, rank);
		const resultStr = await this.api.get(url, false);
		if (!resultStr?.length) {
			console.log('could not load meta decks', format, time, rank, url);
			return null;
		}

		const stats: DeckStats = JSON.parse(resultStr);
		console.log('[constructed-meta-decks] loaded meta decks', format, time, rank, stats?.dataPoints);
		if (!stats) {
			return stats as ExtendedDeckStats;
		}

		console.debug('[constructed-meta-decks] will load all cards in decks');
		const result: ExtendedDeckStats = {
			...stats,
			deckStats: stats.deckStats.map((deck) => {
				const allCardsInDeck = [...(deck.cardVariations?.added ?? []), ...(deck.archetypeCoreCards ?? [])];
				for (const removed of deck.cardVariations?.removed ?? []) {
					// Remove the first instance of the cards from allCardsInDeck
					const index = allCardsInDeck.indexOf(removed);
					if (index !== -1) {
						allCardsInDeck.splice(index, 1);
					}
				}
				return {
					...deck,
					allCardsInDeck: allCardsInDeck,
					archetypeName: buildArchetypeName(deck.archetypeName, this.i18n),
				};
			}),
		};
		console.debug('[constructed-meta-decks] done loading all cards in decks');
		return result;
	}

	public async loadNewDeckDetails(
		deckstring: string | undefined | null,
		format: GameFormat,
		time: TimePeriod,
		rank: RankBracket,
	): Promise<DeckStat | null> {
		// if (12 % 2 === 60) {
		// 	return null;
		// }
		return this.mainInstance.loadNewDeckDetailsInternal(deckstring, format, time, rank);
	}

	private async loadNewDeckDetailsInternal(
		deckstring: string | undefined | null,
		format: GameFormat,
		time: TimePeriod,
		rank: RankBracket,
	) {
		if (!deckstring) {
			return null;
		}

		const cacheKey = `${format}_${time}_${rank}_${deckstring}`;
		console.debug('[constructed-meta-decks] checking cache', cacheKey, this.deckDetailsCache[cacheKey]);
		if (this.deckDetailsCache[cacheKey] !== undefined) {
			console.debug('[constructed-meta-decks] returning cached value', cacheKey, this.deckDetailsCache[cacheKey]);
			return this.deckDetailsCache[cacheKey];
		}

		// console.debug('loading new deck details', new Error().stack, deckstring, format, time, rank);
		time = (time as string) === 'all-time' ? 'past-20' : time;
		const deckId = encodeURIComponent(deckstring.replace('/', '-'));
		const url = `${CONSTRUCTED_META_DECK_DETAILS_URL}`
			.replace('{format}', format)
			.replace('{rank}', rank)
			.replace('{timePeriod}', time)
			.replace('{deckId}', deckId);
		console.debug('[constructed-meta-decks] will load stat for deck', url, format, time, rank, deckstring);
		// Can happen if there is no data for the deck
		const resultStr = await this.api.get(url, false);
		if (!resultStr?.length) {
			this.deckDetailsCache[cacheKey] = null;
			console.log('[constructed-meta-decks] could not load meta deck', format, time, rank, url);
			return null;
		}

		const deck: DeckStat = JSON.parse(resultStr);
		console.debug('[constructed-meta-decks] loaded deck', format, time, rank, deck?.totalGames, deck);
		this.deckDetailsCache[cacheKey] = deck;
		return deck;
	}

	// private async loadNewDeckDetailsInternal2(
	// 	deckstring: string | undefined | null,
	// 	format: GameFormat,
	// 	time: TimePeriod,
	// 	rank: RankBracket,
	// ) {
	// 	if (!deckstring) {
	// 		return null;
	// 	}

	// 	const cacheKey = `${format}_${time}_${rank}_${deckstring}`;
	// 	console.debug('[constructed-meta-decks] checking cache', cacheKey, this.cache[cacheKey]);
	// 	if (this.cache[cacheKey]) {
	// 		console.debug('[constructed-meta-decks] returning cached value', cacheKey, this.cache[cacheKey]);
	// 		return this.cache[cacheKey];
	// 	}

	// 	const decoded = decode(deckstring);
	// 	const hero = decoded?.heroes?.[0];
	// 	const heroClass = this.cards.getCard(hero)?.classes?.[0];
	// 	if (!heroClass) {
	// 		console.warn('could not find hero class', hero, decoded, deckstring);
	// 		return null;
	// 	}

	// 	const playerClass = heroClass.toLowerCase();
	// 	time = (time as string) === 'all-time' ? 'past-20' : time;
	// 	const deckId = deckstring.replaceAll('/', '-');
	// 	const allDecksForClass = await this.api.callGetApi<readonly DeckStat[]>(
	// 		`https://static.zerotoheroes.com/api/constructed/stats/decks/${format}/${rank}/${time}/all-decks-${playerClass}.gz.json`,
	// 	);
	// 	const deck = allDecksForClass?.find((deck: DeckStat) => deck.decklist.replaceAll('/', '-') === deckId);
	// 	if (!deck) {
	// 		this.cache[cacheKey] = null;
	// 		console.log('[constructed-meta-decks] could not load meta deck', format, time, rank);
	// 		return null;
	// 	}

	// 	console.debug('[constructed-meta-decks] loaded deck', format, time, rank, deck?.totalGames, deck);
	// 	this.cache[cacheKey] = deck;
	// 	return deck;
	// }

	public async loadNewArchetypes(
		format: GameFormat,
		time: TimePeriod,
		rank: RankBracket,
	): Promise<ArchetypeStats | null> {
		return this.mainInstance.loadNewArchetypesInternal(format, time, rank);
	}

	private async loadNewArchetypesInternal(
		format: GameFormat,
		time: TimePeriod,
		rank: RankBracket,
	): Promise<ArchetypeStats | null> {
		time = (time as string) === 'all-time' ? 'past-20' : time;
		const fileName = `${format}/${rank}/${time}/overview-from-hourly.gz.json`;

		if (this.archetypesCache[fileName] !== undefined) {
			console.debug(
				'[constructed-meta-decks] returning archetype cached value',
				fileName,
				this.archetypesCache[fileName],
			);
			return this.archetypesCache[fileName];
		}

		const url = `${CONSTRUCTED_META_ARCHETYPES_BASE_URL}/${fileName}`;
		console.log('[constructed-meta-decks] will load archetype stats', url, format, time, rank);
		const resultStr = await this.api.get(url, false);
		if (!resultStr?.length) {
			console.log('could not load meta decks', format, time, rank, url);
			this.archetypesCache[fileName] = null;
			return null;
		}

		const stats: ArchetypeStats = JSON.parse(resultStr);
		console.log('[constructed-meta-decks] loaded meta archetypes', format, time, rank, stats?.dataPoints);
		this.archetypesCache[fileName] = stats;
		return stats;
	}

	public async loadNewArchetypeDetails(
		archetypeId: number,
		format: GameFormat,
		time: TimePeriod,
		rank: RankBracket,
	): Promise<ArchetypeStat | null> {
		// if (12 % 2 === 60) {
		// 	return null;
		// }
		if (!archetypeId) {
			return null;
		}

		time = (time as string) === 'all-time' ? 'past-20' : time;
		const fileName = `${format}/${rank}/${time}/archetype/${archetypeId}.gz.json`;
		const url = `${CONSTRUCTED_META_ARCHETYPES_BASE_URL}/${fileName}`;
		console.log('[constructed-meta-decks] will load stat for archetype', url, format, time, rank, archetypeId);
		const resultStr = await this.api.get(url, false);
		if (!resultStr?.length) {
			console.log('could not load meta archetypes', format, time, rank, url);
			return null;
		}

		const deck: ArchetypeStat = JSON.parse(resultStr);
		console.debug('[constructed-meta-decks] loaded archetype', format, time, rank, deck?.totalGames);
		return deck;
	}
}

export interface ExtendedDeckStats extends DeckStats {
	deckStats: readonly ExtendedDeckStat[];
}

export interface ExtendedDeckStat extends DeckStat {
	allCardsInDeck: readonly string[];
}
