import { Inject, Injectable } from '@angular/core';
import { DeckDefinition, decode, encode } from '@firestone-hs/deckstrings';
import {
	ARENAS,
	CardClass,
	GameFormat,
	GameType,
	getDefaultHeroDbfIdForClass,
	normalizeDeckHeroDbfId,
	PRACTICE_ALL,
	SCENARIO_WITHOUT_RESTART,
	ScenarioId,
	SceneMode,
	SOLO_SCENARIO_WITH_LOGGED_DECKLIST,
} from '@firestone-hs/reference-data';
import { DeckInfoFromMemory, MemoryInspectionService, MemoryUpdatesService, SceneService } from '@firestone/memory';
import {
	GameStatusService,
	getLogsDir,
	LOG_FILE_BACKEND,
	LogFileBackend,
	PreferencesService,
} from '@firestone/shared/common/service';
import { ApiRunner, CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { Metadata } from '../../models/metadata';
import { DeckHandlerService } from '../deck-handler.service';
import { explodeDecklist, normalizeWithDbfIds } from '../deck-utils';
import { GameEvent } from '../game-events/game-event';
import { GameEventsEmitterService } from '../game-events/game-events-emitter.service';

const DECK_TEMPLATES_URL = `https://static.zerotoheroes.com/hearthstone/data/deck-templates.gz.json`;
const OPEN_BRAWL_LISTS_URL = `https://static.zerotoheroes.com/hearthstone/data/brawl_lists`;

@Injectable()
export class DeckParserService {
	public currentDeck$$ = new BehaviorSubject<DeckInfo | null>(null);

	private readonly deckNameRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ### (.*)');
	private readonly deckstringRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ([a-zA-Z0-9\\/\\+=]+)$');
	private spectating: boolean = false;
	private selectedDeckId: number = 0;
	private currentDeck: DeckInfo | null;

	private deckTemplates: readonly DeckTemplate[];

	public forcedDeckstring: string | undefined;

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly memoryUpdates: MemoryUpdatesService,
		private readonly memory: MemoryInspectionService,
		private readonly allCards: CardsFacadeService,
		private readonly ow: OverwolfService,
		private readonly handler: DeckHandlerService,
		private readonly api: ApiRunner,
		private readonly prefs: PreferencesService,
		private readonly gameStatus: GameStatusService,
		private readonly scene: SceneService,
		@Inject(LOG_FILE_BACKEND) private readonly logsBackend: LogFileBackend,
	) {
		this.init();
		if (typeof window !== 'undefined') {
			window['getCurrentDeck'] = (gameType: GameType, formatType: GameFormat) =>
				this.retrieveCurrentDeck(false, {
					gameType: gameType ?? GameType.GT_PVPDR,
					formatType: formatType ?? GameFormat.FT_WILD,
					scenarioId: ScenarioId._314_ARENA_SEASON,
				});
		}
	}

	public async getCurrentDeck(timeout?: number): Promise<DeckInfo | null> {
		if (!timeout) {
			return this.currentDeck;
		}
		return Promise.race([
			new Promise<DeckInfo | null>((resolve) => {
				const interval = setInterval(() => {
					if (this.currentDeck) {
						clearInterval(interval);
						resolve(this.currentDeck);
					}
				}, 1000);
			}),
			new Promise<DeckInfo | null>((resolve) => {
				setTimeout(() => {
					resolve(null);
				}, timeout);
			}),
		]);
	}

	public async retrieveCurrentDeck(
		usePreviousDeckIfSameScenarioId: boolean,
		metadata: Metadata,
	): Promise<DeckInfo | null> {
		if (this.forcedDeckstring) {
			const deck = decode(this.forcedDeckstring);
			console.warn('[deck-parser] forced deckstring', this.forcedDeckstring);
			return {
				deckstring: this.forcedDeckstring,
				name: 'Forced Deck',
				scenarioId: metadata.scenarioId,
				gameType: metadata.gameType,
				deck: deck,
			} as DeckInfo;
		}
		console.log(
			'[deck-parser] retrieving current deck',
			this.currentDeck,
			usePreviousDeckIfSameScenarioId,
			metadata,
		);
		if (this.spectating) {
			console.debug('[deck-parser] spectating, not returning any deck');
			return null;
		}

		if (this.selectedDeckId < 0) {
			console.debug(
				'[deck-parser] retrieving template deck',
				this.selectedDeckId,
				metadata.scenarioId,
				metadata.gameType,
			);
			return this.getTemplateDeck(
				this.selectedDeckId,
				metadata.scenarioId,
				metadata.gameType,
				metadata.formatType,
			);
		}

		console.debug(
			'[deck-parser] rebuilding deck',
			this.selectedDeckId,
			this.currentDeck?.scenarioId,
			metadata.scenarioId,
		);
		const deckFromMemory = await this.memory.getActiveDeck(this.selectedDeckId, 1);
		console.debug(
			'[deck-parser] active deck from memory',
			this.selectedDeckId,
			deckFromMemory,
			this.scene.lastNonGamePlayScene$$.value,
		);
		const activeDeck = deckFromMemory;

		console.debug(
			'[deck-parser] active deck',
			activeDeck,
			this.isDeckLogged(metadata.scenarioId),
			metadata.scenarioId,
			this.scene.currentScene$$.value,
		);
		let deckInfo: DeckInfo | null;

		// The only case where we want to reuse cached deck is when we have Restart option
		const shouldUseCachedDeck =
			metadata.gameType === GameType.GT_VS_AI && !SCENARIO_WITHOUT_RESTART.includes(metadata.scenarioId);
		if (activeDeck && activeDeck.DeckList && activeDeck.DeckList.length > 0) {
			console.debug('[deck-parser] updating active deck', activeDeck, this.currentDeck);
			deckInfo = this.updateDeckFromMemory(activeDeck, metadata.scenarioId, metadata.gameType);
		} else if (
			shouldUseCachedDeck &&
			this.currentDeck?.deck &&
			// When selecting the deck in the deck selection screen, we don't have any sceanrio ID
			(this.selectedDeckId || this.currentDeck.scenarioId === metadata.scenarioId)
		) {
			console.debug('[deck-parser] returning cached deck', this.currentDeck, metadata, this.selectedDeckId);
			return this.currentDeck;
		} else if (this.isDeckLogged(metadata.scenarioId)) {
			console.log('[deck-parser] trying to read previous deck from logs', metadata.scenarioId);
			deckInfo = await this.readDeckFromLogFile(metadata.scenarioId, metadata.gameType);
		} else if (metadata.gameType === GameType.GT_TAVERNBRAWL) {
			console.log('[deck-parser] trying to read tavern brawl previous deck from logs', metadata.scenarioId);
			// This could work, because it looks like that the deck is named "Brawl Deck" in all languages
			// UPDATE 2024-11-02: the pre-release Brawl Deck is named "乱斗模式套牌" in chinese
			// UPDATE 2025-07-01: it now has a localized name
			deckInfo = await this.readDeckFromLogFile(metadata.scenarioId, metadata.gameType, [
				'Brawl Deck',
				'乱斗模式套牌',
			]);
			console.debug('[deck-parser] tavern brawl deck info', deckInfo);
			if (!deckInfo) {
				deckInfo = await this.readDeckFromLogFile(metadata.scenarioId, metadata.gameType);
				console.debug('[deck-parser] tavern brawl deck info 2', deckInfo);
			}
		} else {
			console.warn('[deck-parser] could not read any deck from memory');
			deckInfo = null;
		}

		this.setCurrentDeck(deckInfo);
		return this.currentDeck;
	}

	public async getOpenDecklist(heroCardId: string, metadata: Metadata): Promise<string | null> {
		if (metadata.gameType === GameType.GT_TAVERNBRAWL) {
			console.log('[deck-parser] trying to read open tavern brawl decklist', metadata.scenarioId, heroCardId);
			const brawlInfo: any = await this.api.callGetApi(`${OPEN_BRAWL_LISTS_URL}/${metadata.scenarioId}.json`);
			console.debug('[deck-parser] tavern brawl lists', brawlInfo);
			const list = brawlInfo?.lists?.[heroCardId];
			console.debug('[deck-parser] tavern brawl list', list);
			return list?.deckstring;
		}
		return null;
	}

	public async getTemplateDeck(
		deckId: number,
		scenarioId: number | null,
		gameType: GameType | null,
		gameFormat: GameFormat | null,
	): Promise<DeckInfo | null> {
		if (this.spectating) {
			console.log('[deck-parser] spectating, not returning Whizbang deck');
			return null;
		}

		// Templates are negative
		const deckTemplates = await this.getDeckTemplates();
		const deck = deckTemplates.find((deck) => +(deck.DeckId ?? 0) === deckId || +deck.TemplateId === -deckId);
		console.debug('[deck-parser] deckTemplate', deckId, deck);
		if (deck && deck.DeckList && deck.DeckList.length > 0) {
			console.log('[deck-parser] updating active deck 2', deck, this.currentDeck);
			this.setCurrentDeck(this.updateDeckFromMemory(deck, scenarioId, gameType, gameFormat));
		} else {
			await this.memory.getWhizbangDeck(deckId);
			this.setCurrentDeck(null);
		}
		return this.currentDeck;
	}

	private async getDeckTemplates(): Promise<readonly DeckTemplate[]> {
		if (!this.deckTemplates?.length) {
			const templatesFromRemote: readonly DeckTemplate[] | null = await this.api.callGetApi(DECK_TEMPLATES_URL);
			this.deckTemplates = (templatesFromRemote ?? [])
				.filter((template) => template.DeckList?.length)
				.map(
					(template) =>
						({
							...template,
							DeckList: template.DeckList.map((dbfId) => +dbfId),
						}) as DeckTemplate,
				);
		}
		return this.deckTemplates ?? [];
	}

	private async init() {
		await this.scene.isReady();

		this.gameEvents.allEvents.subscribe((event: GameEvent) => {
			if (event.type === GameEvent.SPECTATING) {
				this.spectating = event.additionalData.spectating;
				if (this.spectating) {
					console.log('[deck-parser] spectating, resetting deck', event.additionalData);
					this.setCurrentDeck({} as DeckInfo);
				}
			} else if (event.type === GameEvent.GAME_END) {
				if (
					this.currentDeck?.gameType !== GameType.GT_VS_AI ||
					SCENARIO_WITHOUT_RESTART.includes(this.currentDeck?.scenarioId ?? 0)
				) {
					console.log(
						'[deck-parser] game end on a non-restart scenario, resetting deck',
						this.currentDeck?.gameType,
						this.currentDeck?.scenarioId,
					);
					this.setCurrentDeck({} as DeckInfo);
					// In some cases, the "selected deck" memory event is not fired when switching decks (I don't know why though)
					// So it's probably safer to reset the selected deck id, since normally the event is also fired when the
					// deck is not changed
					this.selectedDeckId = 0;
				}
			}
		});

		this.memoryUpdates.memoryUpdates$$.subscribe(async (changes) => {
			if (this.spectating) {
				console.log('[deck-parser] spectating, not registering memory update');
				return;
			}

			if (changes.SelectedDeckId) {
				console.log('[deck-parser] selected deck id', changes.SelectedDeckId);
				this.selectedDeckId = changes.SelectedDeckId;
				if (this.selectedDeckId < 0) {
					console.log('[deck-parser] getting template deck after ID selection', this.selectedDeckId);
					await this.getTemplateDeck(this.selectedDeckId, null, null, null);
				} else {
					const activeDeck = await this.memory.getActiveDeck(this.selectedDeckId, 2, true);
					console.debug(
						'[deck-parser] getting active deck from memory after ID selection',
						this.selectedDeckId,
						activeDeck,
					);
					if (activeDeck && activeDeck.DeckList && activeDeck.DeckList.length > 0) {
						console.debug(
							'[deck-parser] updating active deck after ID selection',
							activeDeck,
							this.currentDeck,
						);
						this.setCurrentDeck(this.updateDeckFromMemory(activeDeck, null, null));
					}
				}
			}
		});

		this.scene.currentScene$$.subscribe(async (scene) => {
			// Resetting the selectedDeckId if empty means that if a memory update reset occurs while on
			// the deck selection screen, or simply that another memory update event occurs (which
			// will have a null selected deck)
			// Only reset when moving away from the scene where selecting a deck is possible
			if (scene !== SceneMode.GAMEPLAY) {
				if (!!this.selectedDeckId || !!this.currentDeck) {
					// Don't reset if we're reconnecting
					const lines: readonly string[] = await this.readAllLogLines();
					// ignore everythine if the lines don't contain any "finding game with deck"
					// this means that we're reconnecting and that have just received the full list of decks
					if (
						lines.some((line) => line.includes('Finding Game With Deck')) ||
						lines.some((line) => line.includes('Finding Game With Hero')) ||
						// When reconnecting, the sequence of scenes is always the same: LOGIN, then GAMEPLAY
						// So if we go to through another non-gameplay scene that isn't LOGIN, it means that
						// we can safely reset
						scene !== SceneMode.LOGIN
					) {
						this.selectedDeckId = 0;
						// Reset the cached deck, as it should only be used when restarting the match
						this.setCurrentDeck(null);
					}
				}
			}
		});

		// Init fields that are normally populated from memory reading events
		if (await this.gameStatus.inGame()) {
			this.selectedDeckId = (await this.memory.getSelectedDeckId()) ?? 0;
		}
	}

	private setCurrentDeck(deck: DeckInfo | null) {
		this.currentDeck = deck;
		this.currentDeck$$.next(deck);
		if (this.currentDeck) {
			console.debug('[deck-parser] set current deck', this.currentDeck, JSON.stringify(this.currentDeck));
		}
	}

	private updateDeckFromMemory(
		deckFromMemory: DeckInfoFromMemory,
		scenarioId: number | null,
		gameType: GameType | null,
		gameFormat?: GameFormat | null,
	): DeckInfo | null {
		console.log('[deck-parser] updating deck from memory', deckFromMemory);
		if (!deckFromMemory) {
			console.error('[deck-parser] no deck to update');
			return null;
		}

		const decklist: readonly number[] = normalizeWithDbfIds(deckFromMemory.DeckList, this.allCards);
		console.debug('[deck-parser] checking allCards', this.allCards?.getCards()?.length ?? 'null');
		console.debug('[deck-parser] normalized decklist with dbf ids', decklist, deckFromMemory.HeroCardId);
		const deckDefinition: DeckDefinition = {
			format: deckFromMemory.FormatType || gameFormat || GameFormat.FT_WILD,
			cards: explodeDecklist(decklist),
			// Add a default to avoid an exception, for cases like Dungeon Runs or whenever you have an exotic hero
			heroes: deckFromMemory.HeroCardId
				? [
						normalizeDeckHeroDbfId(
							this.allCards.getCard(deckFromMemory.HeroCardId)?.dbfId ?? 7,
							this.allCards.getService(),
						),
					]
				: deckFromMemory.HeroClass
					? [getDefaultHeroDbfIdForClass(CardClass[deckFromMemory.HeroClass]) || 7]
					: [7],
			sideboards: !deckFromMemory.Sideboards?.length
				? undefined
				: deckFromMemory.Sideboards.map((sideboard) => {
						return {
							keyCardDbfId: this.allCards.getCard(sideboard.KeyCardId).dbfId,
							cards: explodeDecklist(normalizeWithDbfIds(sideboard.Cards, this.allCards)),
						};
					}),
		};
		console.debug(
			'[deck-parser] built deck definition',
			deckFromMemory.HeroCardId,
			deckFromMemory.HeroClass,
			gameFormat,
			deckDefinition,
			JSON.stringify(deckDefinition),
			deckDefinition.cards.map((pair) => pair[0]),
			deckDefinition.cards.some((pair) => pair[0] == null),
			deckDefinition.cards.some((pair) => isNaN(pair[0])),
		);
		const deckString = deckDefinition.cards.some((pair) => pair[0] == null || isNaN(pair[0]))
			? null
			: encode(deckDefinition);
		console.log('[deck-parser] built deckstring', deckString);
		const currentDeck: DeckInfo = {
			deck: deckDefinition,
			name: deckFromMemory.Name,
			deckstring: deckString,
			scenarioId: scenarioId,
			gameType: gameType,
		};
		console.debug('[deck-parser] built deck info', currentDeck);
		return currentDeck;
	}

	private isDeckLogged(scenarioId: number): boolean {
		const loggingSCenarios: readonly number[] = [
			...PRACTICE_ALL,
			...ARENAS,
			...SOLO_SCENARIO_WITH_LOGGED_DECKLIST,
			ScenarioId.STANDARD_1_VS_1_GAME,
			ScenarioId.TWIST___NEW_AGE,
			ScenarioId.TWIST___CLASSIC,
			ScenarioId.TWIST___UNGORO,
			ScenarioId.TWIST___WONDERS,
			ScenarioId.TWIST___WONDERS_XL,
			ScenarioId.TAVERN_BRAWL_BRAWLISEUM,
			ScenarioId.TAVERN_BRAWL_WILD_BRAWLISEUM,
		];
		return loggingSCenarios.includes(scenarioId);
	}

	private async readDeckFromLogFile(
		scenarioId: number,
		gameType: GameType,
		targetDeckNames: readonly string[] | null = null,
	): Promise<DeckInfo | null> {
		const lines: readonly string[] = await this.readAllLogLines();

		// const debugDeckstring = 'AAEBAf0EBMABvqQDiKgDx7IEDfcN67oCh70Cj9MC9KsDkeED558ExqAEo+QE/uwEvO0E/5IF4MMFAAA=';
		// return {
		// 	deckstring: debugDeckstring,
		// 	name: 'hop',
		// 	scenarioId: scenarioId,
		// 	gameType: gameType,
		// 	deck: !!debugDeckstring ? decode(debugDeckstring) : undefined,
		// } as DeckInfo;

		// ignore everythine if the lines don't contain any "finding game with deck"
		// this means that we're reconnecting and that have just received the full list of decks
		// TODO: test other languages
		if (
			!lines.some((line) => line.includes('Finding Game With Deck')) &&
			!lines.some((line) => line.includes('Finding Game With Hero')) &&
			!lines.some((line) => line.includes('Starting Arena Game With Deck'))
		) {
			console.log('[deck-parser] ignoring deck log lines because there is no "finding game with deck"');
			return null;
		}

		if (lines.length >= 4) {
			console.log('[deck-parser] lets go', lines[lines.length - 4], 'hop', lines[lines.length - 3], gameType);
			const deckNameLogLine = lines[lines.length - 3];
			console.log('[deck-parser] deckName', deckNameLogLine);
			const deckstringLogLine = lines[lines.length - 1];
			console.log('[deck-parser] deckstring', deckstringLogLine);
			let match: RegExpExecArray | null;
			const deckName = (match = this.deckNameRegex.exec(deckNameLogLine)) ? match[1] : undefined;
			const deckstring = (match = this.deckstringRegex.exec(deckstringLogLine))
				? this.handler.normalizeDeckstring(match[1])
				: undefined;
			if (!!targetDeckNames?.length && (!deckName || !targetDeckNames.includes(deckName))) {
				console.log('[deck-parser] deck name does not match', deckName, targetDeckNames);
				return null;
			}
			if (!deckstring) {
				return null;
			}

			return {
				deckstring: deckstring,
				name: deckName,
				scenarioId: scenarioId,
				gameType: gameType,
				deck: !!deckstring ? decode(deckstring) : undefined,
			} as DeckInfo;
		}

		return null;
	}

	private async readAllLogLines(): Promise<readonly string[]> {
		const fileName = 'Decks.log';
		const gameInfo = await this.logsBackend.getRunningGameInfo();
		const prefs = await this.prefs.getPreferences();
		const logsDir = await getLogsDir(this.logsBackend, gameInfo, prefs);
		const logsLocation = `${logsDir}\\${fileName}`;
		const logsContents = await this.logsBackend.readTextFile(logsLocation);
		if (!logsContents) {
			return [];
		}
		const lines = logsContents
			.split('\n')
			.filter((line) => line && line.length > 0)
			.map((line) => line.trim());
		return lines;
	}
}

export interface DeckInfo {
	scenarioId: number | null;
	name: string;
	deckstring: string | null;
	deck: DeckDefinition | null;
	gameType: GameType | null;
}

export interface DeckTemplate extends DeckInfoFromMemory {
	TemplateId: number;
}
