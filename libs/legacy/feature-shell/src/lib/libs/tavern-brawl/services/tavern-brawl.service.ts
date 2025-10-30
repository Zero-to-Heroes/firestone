/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import {
	ConstructedCardData,
	ConstructedCoinPlayInfo,
	ConstructedDiscoverCardData,
	ConstructedMatchupInfo,
	GameFormat,
	RankBracket,
	TimePeriod,
} from '@firestone-hs/constructed-deck-stats';
import { decode } from '@firestone-hs/deckstrings';
import { DeckStat, TavernBrawlDetailedStats, TavernBrawlStats } from '@firestone-hs/tavern-brawl-stats';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	CardsFacadeService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

const TAVERN_BRAWL_OVERVIEW_URL = 'https://static.zerotoheroes.com/api/tavern-brawl/tavern-brawl-stats-2.gz.json';
const TAVERN_BRAWL_META_URL = 'https://static.zerotoheroes.com/api/tavern-brawl/tavern-brawl-stats-detailed.gz.json';

@Injectable()
export class TavernBrawlService extends AbstractFacadeService<TavernBrawlService> {
	public tavernBrawl$$: SubscriberAwareBehaviorSubject<TavernBrawlStats | null>;
	public metaDecks$$: SubscriberAwareBehaviorSubject<ExtendedDeckStats | null>;
	public cardSearch$$: BehaviorSubject<readonly string[] | null>;

	private api: ApiRunner;
	private allCards: CardsFacadeService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'TavernBrawlService', () => !!this.tavernBrawl$$);
	}

	protected override assignSubjects() {
		this.tavernBrawl$$ = this.mainInstance.tavernBrawl$$;
		this.metaDecks$$ = this.mainInstance.metaDecks$$;
		this.cardSearch$$ = this.mainInstance.cardSearch$$;
	}

	protected async init() {
		this.tavernBrawl$$ = new SubscriberAwareBehaviorSubject<TavernBrawlStats | null>(null);
		this.metaDecks$$ = new SubscriberAwareBehaviorSubject<ExtendedDeckStats | null>(null);
		this.cardSearch$$ = new BehaviorSubject<readonly string[] | null>(null);
		this.api = AppInjector.get(ApiRunner);
		this.allCards = AppInjector.get(CardsFacadeService);

		this.tavernBrawl$$.onFirstSubscribe(async () => {
			const result = await this.api.callGetApi<TavernBrawlStats>(TAVERN_BRAWL_OVERVIEW_URL);
			this.tavernBrawl$$.next(result);
		});

		this.metaDecks$$.onFirstSubscribe(async () => {
			this.metaDecks$$.next(null);
			const stats = await this.loadNewDecks();
			this.metaDecks$$.next(stats);
		});
	}

	public newCardSearch(search: readonly string[]) {
		this.mainInstance.newCardSearchInternal(search);
	}

	private newCardSearchInternal(search: readonly string[]) {
		this.cardSearch$$.next(search);
	}

	private async loadNewDecks(): Promise<ExtendedDeckStats | null> {
		const url = `${TAVERN_BRAWL_META_URL}`;
		console.log('[tavern-brawl-meta-decks] will load deck stats', url);
		const resultStr = await this.api.get(url, false);
		if (!resultStr?.length) {
			console.log('could not load meta decks', url);
			return null;
		}

		const stats: TavernBrawlDetailedStats = JSON.parse(resultStr);
		console.log('[tavern-brawl-meta-decks] loaded meta decks', stats?.stats?.length);
		if (!stats) {
			return null;
		}

		console.debug('[tavern-brawl-meta-decks] will load all cards in decks');
		const result: ExtendedDeckStats = {
			...stats,
			deckStats: stats.stats
				.map((deck) => {
					const allCardsInDeck = this.buildAllCardsInDeck(deck);
					const result: ExtendedDeckStat = {
						...deck,
						allCardsInDeck: allCardsInDeck,
						totalGames: deck.matches,
						totalWins: deck.wins,
						rankBracket: null,
						timePeriod: null,
						format: null,
						archetypeId: null,
						archetypeName: null,
						lastUpdate: null,
						cardsData: [],
						discoverData: [],
						matchupInfo: [],
						coinPlayInfo: [],
						cardVariations: {
							added: allCardsInDeck,
							removed: [],
						},
						archetypeCoreCards: [],
					};
					return result;
				})
				.filter((deck) => deck.allCardsInDeck.length > 0),
		};
		console.debug('[tavern-brawl-meta-decks] done building stats');
		return result;
	}

	private buildAllCardsInDeck(deck: DeckStat): readonly string[] {
		try {
			const deckDefinition = decode(deck.decklist);
			const allCardsInDeck = deckDefinition.cards.flatMap((c) =>
				new Array(c[1]).fill(this.allCards.getCard(c[0]).id),
			);
			return allCardsInDeck;
		} catch (e) {
			console.debug('[tavern-brawl-meta-decks] could not decode deck', deck);
			return [];
		}
	}
}

export interface ExtendedDeckStats extends TavernBrawlDetailedStats {
	deckStats: readonly ExtendedDeckStat[];
}

export interface ExtendedDeckStat extends DeckStat {
	readonly allCardsInDeck: readonly string[];
	readonly totalGames: number;
	readonly rankBracket: RankBracket;
	readonly timePeriod: TimePeriod;
	readonly format: GameFormat;
	readonly archetypeId: number;
	readonly archetypeName: string;
	readonly lastUpdate: Date;
	readonly totalWins: number;
	readonly cardsData: readonly ConstructedCardData[];
	readonly discoverData: readonly ConstructedDiscoverCardData[];
	readonly matchupInfo: readonly ConstructedMatchupInfo[];
	readonly coinPlayInfo: readonly ConstructedCoinPlayInfo[];
	readonly cardVariations: {
		readonly added: readonly string[];
		readonly removed: readonly string[];
	};
	readonly archetypeCoreCards?: readonly string[];
}
