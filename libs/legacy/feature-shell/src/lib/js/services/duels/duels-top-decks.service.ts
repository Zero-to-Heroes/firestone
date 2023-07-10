/* eslint-disable @typescript-eslint/no-use-before-define */
import { Injectable } from '@angular/core';
import { DeckDefinition, decode } from '@firestone-hs/deckstrings';
import { DeckStat, DuelsStatDecks } from '@firestone-hs/duels-global-stats/dist/stat';
import { groupByFunction } from '@firestone/shared/framework/common';
import { ApiRunner, CardsFacadeService } from '@firestone/shared/framework/core';
import {
	BehaviorSubject,
	Observable,
	combineLatest,
	concat,
	debounceTime,
	defer,
	distinctUntilChanged,
	filter,
	map,
	skip,
	take,
	tap,
} from 'rxjs';
import { DuelsGroupedDecks } from '../../models/duels/duels-grouped-decks';
import { DuelsDeckStat } from '../../models/duels/duels-player-stats';
import { Set } from '../../models/set';
import { SetsManagerService, getCard } from '../collection/sets-manager.service';
import { LocalizationFacadeService } from '../localization-facade.service';

const DUELS_GLOBAL_STATS_DECKS =
	'https://static.zerotoheroes.com/api/duels/duels-global-stats-hero-class-decks.gz.json';

@Injectable()
export class DuelsTopDeckService {
	public topDeck$: Observable<readonly DuelsGroupedDecks[]>;

	// TODO: remove this and move to full reactive
	/** @deprecated */
	public replaySubject = new BehaviorSubject<readonly DuelsGroupedDecks[]>([]);

	private remoteTopDeckStats$$: BehaviorSubject<ExtendedDuelsStatDecks | null> =
		new BehaviorSubject<ExtendedDuelsStatDecks | null>(null);
	private loadingInitialData = false;

	constructor(
		private readonly api: ApiRunner,
		private readonly setsManager: SetsManagerService,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {
		this.init();
		window['duelsTopDeckService'] = this;
	}

	private async init() {
		const sets$ = this.setsManager.sets$$.asObservable();
		const debouncedSets$ = concat(sets$.pipe(take(1)), sets$.pipe(skip(1), debounceTime(2000))).pipe(
			distinctUntilChanged(),
			tap((sets) => console.log('[duels-top-deck] received sets', sets)),
		);

		this.topDeck$ = defer(() => {
			console.debug('[duels-top-deck] init top deck defer');
			const result = combineLatest([this.remoteTopDeckStats$$, debouncedSets$]).pipe(
				tap((data) => console.debug('[duels-top-deck] received data', data, this.loadingInitialData)),
				filter(([remoteTopDeckStats, sets]) => sets?.length > 0),
				debounceTime(100),
				map(([remoteTopDeckStats, sets]) => {
					if (this.loadingInitialData) {
						return [];
					}

					if (remoteTopDeckStats == null) {
						console.debug('[duels-top-deck] no remote top deck stats, loading initial data');
						this.loadInitialData();
						return [];
					}

					const topDecks: readonly DuelsGroupedDecks[] = this.buildTopDeckStats(
						remoteTopDeckStats.decks ?? [],
						sets,
					);
					console.debug('[duels-top-deck] built top deck stats', topDecks);
					return topDecks;
				}),
			);
			result.subscribe((data) => this.replaySubject.next(data));
			return result;
		});
	}

	private async loadInitialData(): Promise<void> {
		this.loadingInitialData = true;
		const result: DuelsStatDecks = await this.api.callGetApi(DUELS_GLOBAL_STATS_DECKS);
		console.log('[duels-top decks] loaded global stats deck', result?.decks?.length);
		const extendedResult: ExtendedDuelsStatDecks = {
			lastUpdateDate: result.lastUpdateDate,
			decks: result.decks.map((d) => {
				const deckDefinition = decode(d.decklist);
				return {
					...d,
					deckDefinition: deckDefinition,
					allCardNames: deckDefinition.cards
						.map((pair) => pair[0])
						.map((dbfId) => this.allCards.getCard(dbfId)?.name)
						.filter((name) => !!name),
				};
			}),
		};
		this.loadingInitialData = false;
		this.remoteTopDeckStats$$.next(extendedResult);
	}

	private buildTopDeckStats(
		deckStats: readonly ExtendedDeckStat[],
		sets: readonly Set[],
	): readonly DuelsGroupedDecks[] {
		const decks = deckStats
			// This should already be filtered out by the API
			.filter((stat) => stat.decklist)
			// Same here
			.slice(0, 1000)
			.map((stat) => {
				const dustCost = this.buildDustCost(stat.deckDefinition, sets);
				const result = {
					...(stat as DeckStat),
					heroCardId: stat.heroCardId,
					dustCost: dustCost,
					allCardNames: stat.allCardNames,
					startDate: new Date(stat.periodStart).getTime(),
				} as DuelsDeckStat;
				return result;
			})
			.sort((a, b) => b.startDate - a.startDate);
		const groupedDecks: readonly DuelsGroupedDecks[] = [...this.groupDecks(decks)];
		return groupedDecks;
	}

	private groupDecks(decks: readonly DuelsDeckStat[]): readonly DuelsGroupedDecks[] {
		const groupingFunction = (deck: DuelsDeckStat) => {
			const date = new Date(deck.periodStart);
			return date.toLocaleDateString(this.i18n.formatCurrentLocale(), {
				month: 'short',
				day: '2-digit',
				year: 'numeric',
			});
		};
		const groupByDate = groupByFunction(groupingFunction);
		const decksByDate = groupByDate(decks);
		return Object.keys(decksByDate).map((date) => this.buildGroupedDecks(date, decksByDate[date]));
	}

	private buildDustCost(deck: DeckDefinition, sets: readonly Set[]): number {
		const allPairCardInDeck = [...(deck.cards ?? []), ...(deck.sideboards?.flatMap((s) => s.cards) ?? [])];
		const allCardsInDeck = allPairCardInDeck.map((cards) => cards[0]) ?? [];
		const result = allCardsInDeck
			.map((cardDbfId) => this.allCards.getCard(cardDbfId))
			.filter((card) => card)
			.map((card) => getCard(sets, card.id))
			.filter((card) => card)
			.filter((card) => card.getNumberCollected() === 0)
			.map((card) => card.getRegularDustCost())
			.reduce((a, b) => a + b, 0);
		return result;
	}

	private buildGroupedDecks(date: string, decks: readonly DuelsDeckStat[]): DuelsGroupedDecks {
		return DuelsGroupedDecks.create({
			header: date,
			decks: decks,
		} as DuelsGroupedDecks);
	}
}

interface ExtendedDuelsStatDecks extends DuelsStatDecks {
	decks: readonly ExtendedDeckStat[];
}

interface ExtendedDeckStat extends DeckStat {
	readonly deckDefinition: DeckDefinition;
	readonly allCardNames: readonly string[];
}
