/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Injectable } from '@angular/core';
import { DraftPick, Pick, Picks } from '@firestone-hs/arena-draft-pick';
import { ArenaClassStats } from '@firestone-hs/arena-stats';
import { DeckDefinition, encode } from '@firestone-hs/deckstrings';
import {
	ArenaClientStateType,
	ArenaSessionState,
	DraftMode,
	DraftSlotType,
	GameType,
	SceneMode,
} from '@firestone-hs/reference-data';
import { buildDeckDefinition } from '@firestone/game-state';
import {
	ArenaCardPick,
	DeckInfoFromMemory,
	MemoryInspectionService,
	MemoryUpdatesService,
	SceneService,
} from '@firestone/memory';
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
import {
	BehaviorSubject,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	map,
	pairwise,
	skip,
	tap,
	withLatestFrom,
} from 'rxjs';
import { ArenaCombinedCardStats } from '../models/arena-combined-card-stat';
import { ExtendedDraftDeckStats } from '../models/arena-draft';
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
	public cardPackageOptions$$: SubscriberAwareBehaviorSubject<readonly string[] | null>;
	public currentDeck$$: SubscriberAwareBehaviorSubject<DeckInfoFromMemory | null>;
	public draftScreenHidden$$: BehaviorSubject<boolean | null>;
	public currentMode$$: BehaviorSubject<GameType | null>;
	public clientStateType$$: BehaviorSubject<ArenaClientStateType | null>;
	public sessionState$$: BehaviorSubject<ArenaSessionState | null>;
	public currentDraftMode$$: BehaviorSubject<DraftMode | null>;
	public lastPick$$: BehaviorSubject<ArenaCardPick | null>;

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
		this.cardPackageOptions$$ = this.mainInstance.cardPackageOptions$$;
		this.currentDeck$$ = this.mainInstance.currentDeck$$;
		this.draftScreenHidden$$ = this.mainInstance.draftScreenHidden$$;
		this.currentMode$$ = this.mainInstance.currentMode$$;
		this.currentDraftMode$$ = this.mainInstance.currentDraftMode$$;
		this.clientStateType$$ = this.mainInstance.clientStateType$$;
		this.sessionState$$ = this.mainInstance.sessionState$$;
		this.lastPick$$ = this.mainInstance.lastPick$$;
		this.internalSubscriber$$ = this.mainInstance.internalSubscriber$$;
	}

	protected async init() {
		this.currentStep$$ = new SubscriberAwareBehaviorSubject<DraftSlotType | null>(null);
		this.heroOptions$$ = new SubscriberAwareBehaviorSubject<readonly string[] | null>(null);
		this.cardOptions$$ = new SubscriberAwareBehaviorSubject<readonly string[] | null>(null);
		this.cardPackageOptions$$ = new SubscriberAwareBehaviorSubject<readonly string[] | null>(null);
		this.currentDeck$$ = new SubscriberAwareBehaviorSubject<DeckInfoFromMemory | null>(null);
		this.draftScreenHidden$$ = new BehaviorSubject<boolean | null>(null);
		this.currentMode$$ = new BehaviorSubject<GameType | null>(null);
		this.currentDraftMode$$ = new BehaviorSubject<DraftMode | null>(null);
		this.clientStateType$$ = new BehaviorSubject<ArenaClientStateType | null>(null);
		this.sessionState$$ = new BehaviorSubject<ArenaSessionState | null>(null);
		this.lastPick$$ = new BehaviorSubject<ArenaCardPick | null>(null);
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

		this.memoryUpdates.memoryUpdates$$.subscribe(async (changes) => {
			if (changes.ArenaDraftScreenHidden != null) {
				console.debug('[arena-draft-manager] received draft screen hidden', changes.ArenaDraftScreenHidden);
				this.draftScreenHidden$$.next(changes.ArenaDraftScreenHidden);
			}
			if (changes.ArenaCurrentMode != null) {
				console.debug('[arena-draft-manager] received current mode', changes.ArenaCurrentMode);
				this.currentMode$$.next(changes.ArenaCurrentMode);
			}
			if (changes.ArenaDraftMode != null) {
				console.debug('[arena-draft-manager] received current draft mode', changes.ArenaDraftMode);
				this.currentDraftMode$$.next(changes.ArenaDraftMode);
			}
			if (changes.ArenaClientState != null) {
				console.debug('[arena-draft-manager] received current client state', changes.ArenaClientState);
				this.clientStateType$$.next(changes.ArenaClientState);
			}
			if (changes.ArenaPackageCardOptions != null) {
				this.cardPackageOptions$$.next(changes.ArenaPackageCardOptions);
			}
			if (changes.ArenaSessionState != null) {
				console.debug('[arena-draft-manager] received arena session state', changes.ArenaSessionState);
				this.sessionState$$.next(changes.ArenaSessionState);
			}
			if (changes.ArenaLatestCardPick != null) {
				if (
					changes.ArenaLatestCardPick.PickNumber !== this.lastPick$$?.value?.PickNumber &&
					!arraysEqual(changes.ArenaLatestCardPick.Options, this.lastPick$$?.value?.Options)
				) {
					console.log('[arena-draft-manager] received latest card pick', changes.ArenaLatestCardPick);
					this.lastPick$$.next(changes.ArenaLatestCardPick);
				} else {
					console.log(
						'[arena-draft-manager] received latest card pick, but it is the same as the last one, ignoring',
						changes.ArenaLatestCardPick,
						this.lastPick$$.value,
					);
				}
			}
			if (changes.ArenaUndergroundLatestCardPick != null) {
				if (
					changes.ArenaUndergroundLatestCardPick.PickNumber !== this.lastPick$$?.value?.PickNumber &&
					!arraysEqual(changes.ArenaUndergroundLatestCardPick.Options, this.lastPick$$?.value?.Options)
				) {
					console.log(
						'[arena-draft-manager] received latest underground card pick',
						changes.ArenaUndergroundLatestCardPick,
					);
					this.lastPick$$.next(changes.ArenaUndergroundLatestCardPick);
				} else {
					console.log(
						'[arena-draft-manager] received latest underground card pick, but it is the same as the last one, ignoring',
						changes.ArenaUndergroundLatestCardPick,
						this.lastPick$$.value,
					);
				}
			}
		});

		await waitForReady(this.account);
		this.account.region$$
			.pipe(
				filter((region) => !!region),
				distinctUntilChanged(),
				skip(1), // Initial region set doesn't reset everything
			)
			.subscribe(async (region) => {
				console.log('[arena-draft-manager] region changed', region);
				this.currentDeck$$.next(null);
				this.currentStep$$.next(null);
				this.heroOptions$$.next(null);
				this.cardOptions$$.next(null);
				this.draftScreenHidden$$.next(null);
				this.currentMode$$.next(null);
			});

		this.internalSubscriber$$.onFirstSubscribe(async () => {
			await this.scene.isReady();
			console.debug('[arena-draft-manager] init');

			this.memoryUpdates.memoryUpdates$$.subscribe(async (changes) => {
				if (changes.ArenaDraftStep != null) {
					console.debug('[arena-draft-manager] received draft step', changes.ArenaDraftStep);
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
					if (changes.ArenaCardOptions.every((c) => this.allCards.getCard(c.CardId).type === 'Hero')) {
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
						this.cardOptions$$.next(changes.ArenaCardOptions.map((c) => c.CardId));
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
					// Force a reemit of options for the initial state
					if (
						// this.currentDeck$$.value?.GameType != null &&
						this.currentDeck$$.value?.GameType !== arenaDeck?.GameType &&
						this.cardOptions$$.value == null
					) {
						console.debug('[arena-draft-manager] game type changed, resetting options');
						this.cardOptions$$.next([]);
					}
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
			// combineLatest([this.scene.currentScene$$, this.currentMode$$])
			// 	.pipe(filter(([scene, mode]) => scene === SceneMode.DRAFT))
			// 	.subscribe(async ([scene, mode]) => {
			// 		this.prefs.updatePrefs(
			// 			'arenaActiveMode',
			// 			mode === GameType.GT_UNDERGROUND_ARENA ? 'arena-underground' : 'arena',
			// 		);
			// 	});

			this.lastPick$$.pipe(filter((pick) => !!pick?.RunId)).subscribe(async (pick) => {
				const heroRefCard = this.allCards.getCard(pick!.HeroCardId);
				const playerClass = heroRefCard.classes?.[0] ?? heroRefCard.playerClass?.toUpperCase();
				const payload: DraftPick = {
					runId: pick!.RunId,
					pickNumber: pick!.PickNumber,
					options: pick!.Options?.map((option) => option.CardId) ?? [],
					pick: pick!.CardId,
					playerClass: playerClass,
				};
				console.log('[arena-draft-manager] uploading pick', payload);
				this.sendDraftPick(payload);
			});

			// Deck score
			this.currentDeck$$
				.pipe(
					debounceTime(500),
					distinctUntilChanged(
						(previousDeck, currentDeck) => this.deckLength(previousDeck) === this.deckLength(currentDeck),
					),
					tap((deck) => console.debug('[arena-draft-manager] [stat] current deck', deck)),
					pairwise(),
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
						if (!currentDeck?.DeckList?.length) {
							return;
						}

						const isDeckFullyDrafted = currentDeck.DeckList.length === TOTAL_CARDS_IN_AN_ARENA_DECK;
						console.debug(
							'[arena-draft-manager] [stat] computing stats for deck',
							isDeckFullyDrafted,
							currentDeck.DeckList.length,
							currentDeck,
							cardStats,
							classStats,
							this.currentMode$$.value,
						);
						const deckClass = this.allCards.getCard(currentDeck.HeroCardId)?.playerClass?.toUpperCase();
						const classStat = classStats.stats.find((s) => s.playerClass?.toUpperCase() === deckClass);
						const classWinrate = classStat?.totalGames ? classStat.totalsWins / classStat.totalGames : null;
						const cardImpacts = currentDeck.DeckList.map((card) => {
							const cardStat = cardStats.stats.find(
								(s) =>
									this.allCards.getRootCardId(s.cardId) ===
									this.allCards.getRootCardId(this.allCards.getCard(card).id),
							);
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
						const deckDraftStats: ExtendedDraftDeckStats = {
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
							gameMode:
								this.currentMode$$.value === GameType.GT_UNDERGROUND_ARENA
									? 'arena-underground'
									: 'arena',
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
		await Promise.all([
			this.indexedDb.table<DraftPick, string>(ARENA_CURRENT_DECK_PICKS).put(pick),
			this.api.callPostApi(SAVE_DRAFT_PICK_URL, pick),
		]);
		console.debug('[arena-draft-manager] uploaded draft pick');
	}

	private deckLength(deck: DeckInfoFromMemory | null): number {
		const heroSize = !!deck?.HeroCardId?.length ? 1 : 0;
		const deckSize = deck?.DeckList?.length ?? 0;
		return heroSize + deckSize;
	}
}
