/* eslint-disable no-mixed-spaces-and-tabs */
import { Injectable } from '@angular/core';
import { HighWinRunsInfo } from '@firestone-hs/arena-high-win-runs';
import { decode } from '@firestone-hs/deckstrings';
import { PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	CardsFacadeService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { ExtendedArenaRunInfo, ExtendedHighWinRunsInfo, InternalNotableCard } from '../models/arena-high-wins-runs';
import { ArenaCardStatsService } from './arena-card-stats.service';

const RUNS_OVERVIEW_URL = `https://static.zerotoheroes.com/api/arena/stats/decks/%timePeriod%/overview.gz.json`;

const EXPECTED_NOTABLE_CARDS_LENGTH = 1;
@Injectable()
export class ArenaHighWinsRunsService extends AbstractFacadeService<ArenaHighWinsRunsService> {
	public runs$$: SubscriberAwareBehaviorSubject<ExtendedHighWinRunsInfo | null | undefined>;
	public notableCards$$: SubscriberAwareBehaviorSubject<readonly string[] | null | undefined>;
	public cardSearch$$: BehaviorSubject<readonly string[] | null | undefined>;

	private api: ApiRunner;
	private prefs: PreferencesService;
	private cards: CardsFacadeService;
	private cardStats: ArenaCardStatsService;

	private internalSubject$$ = new SubscriberAwareBehaviorSubject<boolean>(false);

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenaHighWinsRunsService', () => !!this.runs$$);
	}

	protected override assignSubjects() {
		this.runs$$ = this.mainInstance.runs$$;
		this.notableCards$$ = this.mainInstance.notableCards$$;
		this.cardSearch$$ = this.mainInstance.cardSearch$$;
	}

	protected async init() {
		this.runs$$ = new SubscriberAwareBehaviorSubject<ExtendedHighWinRunsInfo | null | undefined>(null);
		this.notableCards$$ = new SubscriberAwareBehaviorSubject<readonly string[] | null | undefined>(null);
		this.cardSearch$$ = new BehaviorSubject<readonly string[] | null | undefined>(null);
		this.api = AppInjector.get(ApiRunner);
		this.prefs = AppInjector.get(PreferencesService);
		this.cards = AppInjector.get(CardsFacadeService);
		this.cardStats = AppInjector.get(ArenaCardStatsService);

		this.notableCards$$.onFirstSubscribe(() => {
			this.internalSubject$$.subscribe();
		});

		this.runs$$.onFirstSubscribe(async () => {
			this.internalSubject$$.subscribe();
		});

		this.internalSubject$$.onFirstSubscribe(async () => {
			this.runs$$.subscribe((runs) => {
				console.debug('[arena-high-wins-runs] rebuilding notable cards');
				const notableCards = this.buildNotableCards(runs?.runs?.filter((r) => !!r.decklist?.length) ?? []);
				console.debug('[arena-high-wins-runs] rebuilding notable cards over', notableCards?.length);
				this.notableCards$$.next(notableCards);
			});

			console.debug('[arena-high-wins-runs] runs init');
			await this.prefs.isReady();

			const timePeriod = 'past-20';
			const runs = await this.api.callGetApi<HighWinRunsInfo>(
				RUNS_OVERVIEW_URL.replace('%timePeriod%', timePeriod),
			);
			if (runs == null) {
				console.error('[arena-high-wins-runs] could not load arena high-wins runs');
				return;
			}

			const extendedRuns: ExtendedHighWinRunsInfo = {
				...runs,
				runs: runs.runs
					?.map((r) => {
						const run: ExtendedArenaRunInfo = {
							...r,
							notabledCards: buildNotableCards(r.decklist, this.cards, this.cardStats),
						};
						return run;
					})
					.filter(
						(r) =>
							EXPECTED_NOTABLE_CARDS_LENGTH === null ||
							r.notabledCards.length === EXPECTED_NOTABLE_CARDS_LENGTH,
					),
			};
			console.log('[arena-high-wins-runs] loaded arena stats');
			console.debug('[arena-high-wins-runs] loaded arena stats', runs);
			this.runs$$.next(extendedRuns);
		});
	}

	public getRun$(runId: number): Observable<ExtendedArenaRunInfo | null | undefined> {
		return this.runs$$.pipe(map((runs) => runs?.runs?.find((run) => run.id === runId)));
	}

	public newCardSearch(selected: readonly string[]): void {
		this.mainInstance.newCardSearchInternal(selected);
	}

	private newCardSearchInternal(selected: readonly string[]): void {
		this.cardSearch$$.next(selected);
	}

	private buildNotableCards(runs: readonly ExtendedArenaRunInfo[] | null | undefined): readonly string[] {
		if (!runs) {
			return [];
		}

		const allCards = runs.flatMap((run) => run.notabledCards);
		return [...new Set(allCards.map((c) => c.cardId))];
	}
}

export const buildNotableCards = (
	decklist: string,
	allCards: CardsFacadeService,
	stats: ArenaCardStatsService,
): readonly InternalNotableCard[] => {
	if (!decklist?.length) {
		return [];
	}

	const deckDefinition = decode(decklist);
	const allDbfIds = deckDefinition.cards.flatMap((c) => c[0]);
	const allDeckCards = allDbfIds.map((cardId) => allCards.getCard(cardId));
	// const treasures = allDeckCards.filter((c) => isSignatureTreasure(c.id));
	const legendaries = allDeckCards.filter((c) => c?.rarity === 'Legendary');
	// const cardIds = [...new Set([...legendaries, ...treasures])].map((c) => c.id);
	const allStats = stats.cardStats$$?.value;
	const cardIds = legendaries
		.filter((c) => !!allStats?.stats?.find((s) => s.cardId === c.id)?.draftStats?.totalOffered)
		.map((c) => c.id);
	return cardIds.map((c) => ({
		image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${c}.jpg`,
		cardId: c,
	}));
};
