import { Injectable } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { DuelsDeckSummary } from '../models/duels-personal-deck';

@Injectable()
export class DuelsPersonalDecksService extends AbstractFacadeService<DuelsPersonalDecksService> {
	public decks$$: SubscriberAwareBehaviorSubject<readonly DuelsDeckSummary[] | null>;

	private localStorage: LocalStorageService;
	private prefs: PreferencesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'duelsPersonalDecks', () => !!this.decks$$);
	}

	protected override assignSubjects() {
		this.decks$$ = this.mainInstance.decks$$;
	}

	protected async init() {
		this.decks$$ = new SubscriberAwareBehaviorSubject<readonly DuelsDeckSummary[] | null>(null);
		this.localStorage = AppInjector.get(LocalStorageService);
		this.prefs = AppInjector.get(PreferencesService);

		this.decks$$.onFirstSubscribe(async () => {
			this.decks$$.subscribe(async (decks) => {
				console.debug('[duels-personal-decks] saving personal decks', decks);
				this.localStorage.setItem(LocalStorageService.DUELS_PERSONAL_DECKS, decks);
			});

			const result: readonly DuelsDeckSummary[] | null =
				this.localStorage.getItem<readonly DuelsDeckSummary[]>(LocalStorageService.DUELS_PERSONAL_DECKS) ??
				// Backward compatibility
				((await this.prefs.getPreferences()) as any)?.duelsPersonalAdditionalDecks;
			console.log('[duels-personal-decks] loaded personal decks');
			this.decks$$.next(result ?? []);
		});
	}

	public async addDeck(newDeck: DuelsDeckSummary) {
		const existingDecks = (await this.decks$$.getValueWithInit()) || [];
		const newDecks = [...existingDecks, newDeck].map((deck) =>
			deck.initialDeckList !== newDeck.initialDeckList ? deck : { ...deck, ...newDeck },
		);
		this.decks$$.next(newDecks);
	}

	public async deleteDeck(deckstring: string) {
		const existingDecks = (await this.decks$$.getValueWithInit()) || [];
		const newDecks = existingDecks.filter((deck) => deck.initialDeckList !== deckstring);
		this.decks$$.next(newDecks);
	}
}
