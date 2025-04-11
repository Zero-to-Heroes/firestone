/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { DraftDeckStats, DraftPick, Pick, Picks } from '@firestone-hs/arena-draft-pick';
import { ArenaClassStats } from '@firestone-hs/arena-stats';
import { DeckDefinition, encode } from '@firestone-hs/deckstrings';
import { DraftSlotType, SceneMode } from '@firestone-hs/reference-data';
import { buildDeckDefinition } from '@firestone/game-state';
import { DeckInfoFromMemory, MemoryInspectionService, MemoryUpdatesService, SceneService } from '@firestone/memory';
import { AccountService } from '@firestone/profile/common';
import { ArenaClassFilterType, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { arraysEqual, SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	ARENA_CURRENT_DECK_PICKS,
	CardsFacadeService,
	IndexedDbService,
	waitForReady,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { combineLatest, debounceTime, distinctUntilChanged, filter, map, pairwise, tap, withLatestFrom } from 'rxjs';
import { ArenaCombinedCardStats } from '../models/arena-combined-card-stat';
import { ArenaCardStatsService } from './arena-card-stats.service';
import { ArenaClassStatsService } from './arena-class-stats.service';
import { ArenaDeckStatsService } from './arena-deck-stats.service';
import { IArenaDraftManagerService } from './arena-draft-manager.interface';

const SAVE_DRAFT_PICK_URL = `https://h7rcpfevgh66es5z2jlnblytdu0wfudj.lambda-url.us-west-2.on.aws/`;
const ARENA_DECK_DETAILS_URL = `https://znumiwhsu7lx2chawhhgzhjol40ygaro.lambda-url.us-west-2.on.aws/%runId%`;

const TOTAL_CARDS_IN_AN_ARENA_DECK = 30;

@Injectable({ providedIn: 'root' })
export class ArenaDraftManagerService
	extends AbstractFacadeService<ArenaDraftManagerService>
	implements IArenaDraftManagerService
{
	public currentStep$$: SubscriberAwareBehaviorSubject<DraftSlotType | null>;
	public heroOptions$$: SubscriberAwareBehaviorSubject<readonly string[] | null>;
	public cardOptions$$: SubscriberAwareBehaviorSubject<readonly string[] | null>;
	public currentDeck$$: SubscriberAwareBehaviorSubject<DeckInfoFromMemory | null>;

	private memoryUpdates: MemoryUpdatesService;
	private scene: SceneService;
	private memory: MemoryInspectionService;
	private prefs: PreferencesService;
	private allCards: CardsFacadeService;
	private api: ApiRunner;
	private arenaCardStats: ArenaCardStatsService;
	private arenaClassStats: ArenaClassStatsService;
	private arenaDeckStats: ArenaDeckStatsService;
	private indexedDb: IndexedDbService;
	private account: AccountService;

	private internalSubscriber$$: SubscriberAwareBehaviorSubject<boolean>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(
			windowManager,
			'ArenaDraftManagerService',
			() => !!this.currentStep$$ && !!this.heroOptions$$ && !!this.cardOptions$$ && !!this.currentDeck$$,
		);
	}

	protected override assignSubjects() {
		this.currentStep$$ = this.mainInstance.currentStep$$;
		this.heroOptions$$ = this.mainInstance.heroOptions$$;
		this.cardOptions$$ = this.mainInstance.cardOptions$$;
		this.currentDeck$$ = this.mainInstance.currentDeck$$;
		this.internalSubscriber$$ = this.mainInstance.internalSubscriber$$;
	}

	protected async init() {
		this.currentStep$$ = new SubscriberAwareBehaviorSubject<DraftSlotType | null>(null);
		this.heroOptions$$ = new SubscriberAwareBehaviorSubject<readonly string[] | null>(null);
		this.cardOptions$$ = new SubscriberAwareBehaviorSubject<readonly string[] | null>(null);
		this.currentDeck$$ = new SubscriberAwareBehaviorSubject<DeckInfoFromMemory | null>(null);
		this.memoryUpdates = AppInjector.get(MemoryUpdatesService);
		this.scene = AppInjector.get(SceneService);
		this.memory = AppInjector.get(MemoryInspectionService);
		this.prefs = AppInjector.get(PreferencesService);
		this.allCards = AppInjector.get(CardsFacadeService);
		this.api = AppInjector.get(ApiRunner);
		this.arenaCardStats = AppInjector.get(ArenaCardStatsService);
		this.arenaClassStats = AppInjector.get(ArenaClassStatsService);
		this.arenaDeckStats = AppInjector.get(ArenaDeckStatsService);
		this.indexedDb = AppInjector.get(IndexedDbService);
		this.account = AppInjector.get(AccountService);
		this.internalSubscriber$$ = new SubscriberAwareBehaviorSubject<boolean>(true);

		this.currentStep$$.onFirstSubscribe(async () => {
			this.internalSubscriber$$.subscribe();
		});
		this.heroOptions$$.onFirstSubscribe(async () => {
			this.internalSubscriber$$.subscribe();
		});
		this.cardOptions$$.onFirstSubscribe(async () => {
			this.internalSubscriber$$.subscribe();
		});
		this.currentDeck$$.onFirstSubscribe(async () => {
			this.internalSubscriber$$.subscribe();
		});

		await waitForReady(this.account);
		this.account.region$$.pipe(distinctUntilChanged()).subscribe(async (region) => {
			this.currentDeck$$.next(null);
			this.currentStep$$.next(null);
			this.heroOptions$$.next(null);
			this.cardOptions$$.next(null);
		});

		this.internalSubscriber$$.onFirstSubscribe(async () => {
			await this.scene.isReady();
			console.debug('[arena-draft-manager] init');

			this.memoryUpdates.memoryUpdates$$.subscribe(async (changes) => {
				if (changes.ArenaDraftStep != null) {
					this.currentStep$$.next(changes.ArenaDraftStep);

					if (changes.ArenaDraftStep != null && changes.ArenaDraftStep !== DraftSlotType.DRAFT_SLOT_HERO) {
						this.heroOptions$$.next(null);
					}
					if (changes.ArenaDraftStep != null && changes.ArenaDraftStep !== DraftSlotType.DRAFT_SLOT_CARD) {
						this.cardOptions$$.next(null);
					}
				}
				if (!!changes.ArenaHeroOptions?.length) {
					console.debug(
						'[arena-draft-manager] received hero options',
						changes.ArenaHeroOptions,
						this.heroOptions$$.getValue(),
						this.cardOptions$$.getValue(),
					);
					this.cardOptions$$.next(null);
					this.heroOptions$$.next(changes.ArenaHeroOptions);
				}
				if (!!changes.ArenaCardOptions?.length) {
					if (changes.ArenaCardOptions.every((c) => this.allCards.getCard(c).type === 'Hero')) {
						console.debug(
							'[arena-draft-manager] received hero options as cards, ignoring',
							changes.ArenaCardOptions,
						);
					} else {
						console.debug(
							'[arena-draft-manager] received card options',
							changes.ArenaCardOptions,
							this.heroOptions$$.getValue(),
							this.cardOptions$$.getValue(),
						);
						this.heroOptions$$.next(null);
						this.cardOptions$$.next(changes.ArenaCardOptions);
					}
				}

				const scene = changes.CurrentScene || (await this.scene.currentScene$$.getValueWithInit());
				const currentStep = await this.currentStep$$.getValueWithInit();
				const isDraftingCards = ![DraftSlotType.DRAFT_SLOT_HERO, DraftSlotType.DRAFT_SLOT_HERO_POWER].includes(
					currentStep!,
				);
				// If cards change, or if we are on DRAFT scene + DRAFT_SLOT_CARD, we get the current state of the arena deck
				if (changes.ArenaCurrentCardsInDeck || (scene === SceneMode.DRAFT && isDraftingCards)) {
					const arenaDeck = await this.memory.getArenaDeck();
					console.debug('[arena-draft-manager] received arena deck', arenaDeck);
					this.currentDeck$$.next(arenaDeck);
				}
			});

			combineLatest([this.scene.currentScene$$, this.currentStep$$, this.currentDeck$$])
				.pipe(
					map(([scene, step, deck]) =>
						scene == SceneMode.DRAFT && step === DraftSlotType.DRAFT_SLOT_CARD ? deck?.HeroCardId : null,
					),
				)
				.subscribe(async (heroCardId) => {
					if (!!heroCardId?.length) {
						const playerClass = this.allCards.getCard(heroCardId).classes?.[0];
						if (!!playerClass?.length) {
							const prefs = await this.prefs.getPreferences();
							const newPrefs: Preferences = {
								...prefs,
								arenaActiveClassFilter: playerClass.toLowerCase() as ArenaClassFilterType,
							};
							await this.prefs.savePreferences(newPrefs);
						}
					}
				});

			combineLatest([this.currentDeck$$, this.cardOptions$$])
				.pipe(
					distinctUntilChanged(
						([previousDeck, previousOptions], [currentDeck, currentOptions]) =>
							this.deckLength(previousDeck) === this.deckLength(currentDeck) ||
							arraysEqual(previousOptions, currentOptions),
					),
					pairwise(),
				)
				.subscribe(([[previousDeck, previousOptions], [currentDeck, currentOptions]]) => {
					console.debug(
						'[arena-draft-manager] considering new options',
						previousDeck,
						previousOptions,
						currentDeck,
						currentOptions,
					);

					if (!currentDeck) {
						console.log('[arena-draft-manager] no current deck, not sending pick');
						return;
					}
					if (
						(previousDeck?.Id != null && previousDeck.Id !== currentDeck.Id) ||
						currentDeck.DeckList.length === 0
					) {
						console.log('[arena-draft-manager] new deck, not sending pick');
						return;
					}

					const previousCards: readonly string[] =
						previousDeck?.DeckList?.map((card) => card as string) ?? [];
					// For each card in previousCards, remove one copy of it from the currentCards
					// The remaining cards in currentCards are the ones that were added
					// Be careful, as there can be multiple copies of cards in currentCards, and nly one
					// copy in previousCards
					const addedCards: string[] = currentDeck?.DeckList?.map((card) => card as string) ?? [];
					for (const card of previousCards) {
						const index = addedCards.indexOf(card);
						if (index !== -1) {
							addedCards.splice(index, 1);
						}
					}

					if (addedCards.length !== 1) {
						console.warn(
							'[arena-draft-manager] invalid added cards',
							addedCards,
							previousDeck,
							currentDeck,
							previousOptions,
						);
						return;
					}

					// The "distinctUntilChanged" waits until BOTH the deck and the options have changed
					// This means that the options related to the pick will always be the "previousOptions",
					// unless this is the first pick registered by the app (eg we left then came back)
					// On the first pick, we don't have previous options
					const pickNumber = currentDeck.DeckList.length;
					const options = previousOptions ?? currentOptions;
					const heroRefCard = this.allCards.getCard(currentDeck?.HeroCardId);
					const playerClass = heroRefCard.classes?.[0] ?? heroRefCard.playerClass?.toUpperCase();
					const pick: DraftPick = {
						runId: currentDeck.Id!,
						pickNumber: pickNumber,
						options: options!,
						pick: addedCards[0],
						playerClass: playerClass,
					};
					console.debug(
						'[arena-draft-manager] uploading pick',
						pick,
						previousDeck,
						currentDeck,
						previousOptions,
						currentOptions,
					);
					if (!pick.options?.includes(pick.pick)) {
						console.error('[arena-draft-manager] invalid pick', pick, previousDeck, currentDeck);
					}
					this.sendDraftPick(pick);
				});
			this.currentDeck$$
				.pipe(
					debounceTime(500),
					distinctUntilChanged(
						(previousDeck, currentDeck) => this.deckLength(previousDeck) === this.deckLength(currentDeck),
					),
					tap((deck) => console.debug('[arena-draft-manager] [stat] current deck', deck)),
					pairwise(),
					// tap((info) => console.debug('[arena-draft-manager] [stat] with previous deck', info)),
					// So that we only do it once, when we finish the draft
					// filter(
					// 	([previousDeck, currentDeck]) =>
					// 		currentDeck?.DeckList?.length === TOTAL_CARDS_IN_AN_ARENA_DECK &&
					// 		previousDeck?.DeckList?.length === TOTAL_CARDS_IN_AN_ARENA_DECK - 1,
					// ),
					// tap((info) => console.debug('[arena-draft-manager] [stat] with previous deck 2', info)),
					map(([previousDeck, currentDeck]) => currentDeck),
					filter((deck) => !!deck),
					withLatestFrom(this.arenaCardStats.cardStats$$, this.arenaClassStats.classStats$$),
					filter(
						([currentDeck, cardStats, classStats]) =>
							!!currentDeck && !!cardStats?.stats?.length && !!classStats?.stats,
					),
					map(([currentDeck, cardStats, classStats]) => ({
						currentDeck: currentDeck!,
						cardStats: cardStats!,
						classStats: classStats!,
					})),
				)
				.subscribe(
					({
						currentDeck,
						cardStats,
						classStats,
					}: {
						currentDeck: DeckInfoFromMemory;
						cardStats: ArenaCombinedCardStats;
						classStats: ArenaClassStats;
					}) => {
						const isDeckFullyDrafted = currentDeck.DeckList.length === TOTAL_CARDS_IN_AN_ARENA_DECK;
						console.debug(
							'[arena-draft-manager] [stat] computing stats for deck',
							isDeckFullyDrafted,
							currentDeck.DeckList.length,
							currentDeck,
							cardStats,
							classStats,
						);
						const deckClass = this.allCards.getCard(currentDeck.HeroCardId)?.playerClass?.toUpperCase();
						const classStat = classStats.stats.find((s) => s.playerClass?.toUpperCase() === deckClass);
						const classWinrate = classStat?.totalGames ? classStat.totalsWins / classStat.totalGames : null;
						const cardImpacts = currentDeck.DeckList.map((card) => {
							const cardStat = cardStats.stats.find((s) => s.cardId === card);
							const deckWinrate = !cardStat?.matchStats?.stats?.decksWithCard
								? 0
								: cardStat.matchStats.stats.decksWithCardThenWin /
								  cardStat.matchStats.stats.decksWithCard;
							const deckImpact =
								classWinrate == null || deckWinrate == null ? null : deckWinrate - classWinrate;
							return deckImpact;
						});
						const averageCardImpact =
							(cardImpacts?.reduce((a, b) => (a ?? 0) + (b ?? 0), 0) ?? 0) / cardImpacts.length;
						const deckImpact = 100 * averageCardImpact;
						const deckScore = 100 * (classWinrate! + averageCardImpact);
						const partialDeckDefinition: DeckDefinition = buildDeckDefinition(currentDeck, this.allCards);
						const deckDraftStats: DraftDeckStats = {
							runId: currentDeck.Id!,
							userId: null as any,
							region: null,
							playerClass: deckClass,
							deckImpact: deckImpact,
							deckScore: deckScore,
							// Useful only for partial decks
							creationTimestamp: new Date().getTime(),
							heroCardId: currentDeck.HeroCardId,
							initialDeckList: encode(partialDeckDefinition),
						};
						this.arenaDeckStats.newDeckStat(deckDraftStats, isDeckFullyDrafted);
					},
				);
		});
	}

	public async getPicksForRun(runId: string | number): Promise<readonly Pick[] | null> {
		const localPicks = await this.indexedDb
			.table<DraftPick, string>(ARENA_CURRENT_DECK_PICKS)
			.where('runId')
			.equals(runId)
			.toArray();
		console.debug('[arena-draft-manager] retrieved local picks', localPicks);
		if (!!localPicks?.length) {
			return localPicks;
		}
		const resultFromRemote = await this.api.callGetApi<Picks>(
			ARENA_DECK_DETAILS_URL.replace('%runId%', '' + runId),
		);
		return resultFromRemote?.picks ?? null;
	}

	private async sendDraftPick(pick: DraftPick) {
		await this.indexedDb.table<DraftPick, string>(ARENA_CURRENT_DECK_PICKS).put(pick);
		const result = await this.api.callPostApi(SAVE_DRAFT_PICK_URL, pick);
		console.debug('[arena-draft-manager] uploaded draft pick');
	}

	private deckLength(deck: DeckInfoFromMemory | null): number {
		const heroSize = !!deck?.HeroCardId?.length ? 1 : 0;
		const deckSize = deck?.DeckList?.length ?? 0;
		return heroSize + deckSize;
	}
}
