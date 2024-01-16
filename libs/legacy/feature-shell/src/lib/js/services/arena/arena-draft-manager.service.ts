import { Injectable } from '@angular/core';
import { DraftPick } from '@firestone-hs/arena-draft-pick';
import { DraftSlotType, SceneMode } from '@firestone-hs/reference-data';
import { IArenaDraftManagerService } from '@firestone/arena/common';
import { DeckInfoFromMemory, MemoryInspectionService, MemoryUpdatesService } from '@firestone/memory';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	ApiRunner,
	AppInjector,
	CardsFacadeService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { combineLatest, distinctUntilChanged, map, pairwise, withLatestFrom } from 'rxjs';
import { ArenaClassFilterType } from '../../models/arena/arena-class-filter.type';
import { SceneService } from '../game/scene.service';

const SAVE_DRAFT_PICK_URL = `https://h7rcpfevgh66es5z2jlnblytdu0wfudj.lambda-url.us-west-2.on.aws/`;

@Injectable()
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

	private internalSubscriber$$: SubscriberAwareBehaviorSubject<boolean>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(
			windowManager,
			'arenaDraftManager',
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

		this.internalSubscriber$$.onFirstSubscribe(async () => {
			await this.scene.isReady();
			console.debug('[arena-draft-maanger] init');

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
					this.heroOptions$$.next(changes.ArenaHeroOptions);
				}
				if (!!changes.ArenaCardOptions?.length) {
					this.cardOptions$$.next(changes.ArenaCardOptions);
				}

				const scene = changes.CurrentScene || (await this.scene.currentScene$$.getValueWithInit());
				const currentStep = await this.currentStep$$.getValueWithInit();
				const isDraftingCards = ![DraftSlotType.DRAFT_SLOT_HERO, DraftSlotType.DRAFT_SLOT_HERO_POWER].includes(
					currentStep,
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

			this.currentDeck$$
				.pipe(
					distinctUntilChanged((a, b) => a?.DeckList?.length === b?.DeckList?.length),
					pairwise(),
					withLatestFrom(this.cardOptions$$),
				)
				.subscribe(([[previousDeck, currentDeck], options]) => {
					if (previousDeck.Id !== currentDeck.Id) {
						console.log('[arena-draft-manager] new deck, not sending pick', previousDeck, currentDeck);
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
							options,
						);
						return;
					}

					const pick: DraftPick = {
						runId: currentDeck.Id,
						pickNumber: currentDeck.DeckList.length + 1,
						options: options,
						pick: addedCards[0],
					};
					console.debug(
						'[arena-draft-manager] updating card options',
						pick,
						previousDeck,
						currentDeck,
						options,
					);
					this.sendDraftPick(pick);
				});
		});
	}

	private async sendDraftPick(pick: DraftPick) {
		const result = await this.api.callPostApi(SAVE_DRAFT_PICK_URL, pick);
		console.debug('[arena-draft-manager] uploaded draft pick', result);
	}
}
