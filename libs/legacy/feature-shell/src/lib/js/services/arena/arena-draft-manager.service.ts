import { Injectable } from '@angular/core';
import { DraftSlotType, SceneMode } from '@firestone-hs/reference-data';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { DeckInfoFromMemory } from '../../models/mainwindow/decktracker/deck-info-from-memory';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { Events } from '../events.service';
import { SceneService } from '../game/scene.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';

@Injectable()
export class ArenaDraftManagerService extends AbstractFacadeService<ArenaDraftManagerService> {
	public currentStep$$: SubscriberAwareBehaviorSubject<DraftSlotType | null>;
	public heroOptions$$: SubscriberAwareBehaviorSubject<readonly string[] | null>;
	public cardOptions$$: SubscriberAwareBehaviorSubject<readonly string[] | null>;
	public currentDeck$$: SubscriberAwareBehaviorSubject<DeckInfoFromMemory | null>;

	private events: Events;
	private scene: SceneService;
	private memory: MemoryInspectionService;

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
	}

	protected async init() {
		this.currentStep$$ = new SubscriberAwareBehaviorSubject<DraftSlotType | null>(null);
		this.heroOptions$$ = new SubscriberAwareBehaviorSubject<readonly string[] | null>(null);
		this.cardOptions$$ = new SubscriberAwareBehaviorSubject<readonly string[] | null>(null);
		this.currentDeck$$ = new SubscriberAwareBehaviorSubject<DeckInfoFromMemory | null>(null);
		this.events = AppInjector.get(Events);
		this.scene = AppInjector.get(SceneService);
		this.memory = AppInjector.get(MemoryInspectionService);

		this.currentStep$$.onFirstSubscribe(async () => {
			await this.scene.isReady();
			console.debug('[arena-draft-maanger] init');

			this.events.on(Events.MEMORY_UPDATE).subscribe(async (event) => {
				const changes: MemoryUpdate = event.data[0];
				if (changes.ArenaDraftStep) {
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
		});
	}
}
