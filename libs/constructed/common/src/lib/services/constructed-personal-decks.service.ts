import { Injectable } from '@angular/core';
import { ConstructedDeckVersions, PreferencesService } from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	LocalStorageService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { DeckSummary } from '../models/deck-summary';
import { GameStatsLoaderService } from '@firestone/stats/data-access';

@Injectable()
export class ConstructedPersonalDecksService extends AbstractFacadeService<ConstructedPersonalDecksService> {
	public decks$$: SubscriberAwareBehaviorSubject<readonly DeckSummary[] | null>;

	private localStorage: LocalStorageService;
	private prefs: PreferencesService;
	private gameStats: GameStatsLoaderService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'constructedPersonalDecks', () => !!this.decks$$);
	}

	protected override assignSubjects() {
		this.decks$$ = this.mainInstance.decks$$;
	}

	protected async init() {
		this.decks$$ = new SubscriberAwareBehaviorSubject<readonly DeckSummary[] | null>(null);
		this.localStorage = AppInjector.get(LocalStorageService);
		this.prefs = AppInjector.get(PreferencesService);
		this.gameStats = AppInjector.get(GameStatsLoaderService);

		this.decks$$.onFirstSubscribe(async () => {
			this.decks$$.subscribe(async (decks) => {
				console.debug('[constructed-personal-decks] saving personal decks', decks);
				this.localStorage.setItem(LocalStorageService.CONSTRUCTED_PERSONAL_DECKS, decks);
			});

			const result: readonly DeckSummary[] | null =
				this.localStorage.getItem<readonly DeckSummary[]>(LocalStorageService.CONSTRUCTED_PERSONAL_DECKS) ??
				// Backward compatibility
				((await this.prefs.getPreferences()) as any)?.constructedPersonalAdditionalDecks;
			console.log('[constructed-personal-decks] loaded personal decks');
			this.decks$$.next(result ?? []);
		});
	}

	public async addDeck(newDeck: DeckSummary) {
		const existingDecks = (await this.decks$$.getValueWithInit()) || [];
		const newDecks = [...existingDecks, newDeck].map((deck) =>
			deck.deckstring !== newDeck.deckstring ? deck : { ...deck, ...newDeck },
		);
		this.decks$$.next(newDecks);
	}

	public async deleteDeck(deckstring: string) {
		const existingPersonalDecks = (await this.decks$$.getValueWithInit()) || [];
		const existingPersonalDeck = existingPersonalDecks
			.filter((d) => d.deckstring)
			.find((d) => d.deckstring === deckstring);
		console.debug('[deck-delete] existingPersonalDeck', existingPersonalDeck, existingPersonalDecks);

		// If the deck has only been created via the deckbuilder and has not been played yet,
		// we simply remove it
		// That way, we can easily add it again
		// if (existingPersonalDeck) {
		const currentPrefs = await this.prefs.getPreferences();
		const versionLinks: readonly ConstructedDeckVersions[] = currentPrefs.constructedDeckVersions;
		const linkedDecks = versionLinks.filter((link) => link.versions.map((v) => v.deckstring).includes(deckstring));
		const allDeckstringsToDelete = [
			...(linkedDecks?.flatMap((link) => link.versions.map((v) => v.deckstring)) ?? []),
			deckstring,
		];
		console.debug('[deck-delete] allDecksToDelete', allDeckstringsToDelete, linkedDecks);
		const newDecks = existingPersonalDecks.filter((d) => !allDeckstringsToDelete.includes(d.deckstring));
		// Deleted the personal deck - not the one from the games
		this.decks$$.next(newDecks);

		const allGames = await this.gameStats.gameStats$$.getValueWithInit();

		for (const deck of allDeckstringsToDelete) {
			// const personalDeckStat = existingPersonalDecks.find((d) => d.deckstring === deck);
			const gamesWithDeck = allGames?.stats?.filter((g) => g.playerDecklist === deck);
			const totalGamesWithDeck = gamesWithDeck?.length ?? 0;
			// Only add a deletion date for decks that have games associated with them
			if (totalGamesWithDeck == 0) {
				await this.prefs.setDeckDeleteDates(deck, []);
				continue;
			} else {
				const deletedDeckDates: readonly number[] = currentPrefs.desktopDeckDeletes[deck] ?? [];
				console.log('[deck-delete] deletedDeckDates', deck, deletedDeckDates);
				const newDeleteDates: readonly number[] = [Date.now(), ...deletedDeckDates];
				console.log('[deck-delete] newDeleteDates', newDeleteDates);
				await this.prefs.setDeckDeleteDates(deck, newDeleteDates);
			}
		}
		// }

		// const newDecks = existingDecks.filter((deck) => deck.deckstring !== deckstring);
	}
}
