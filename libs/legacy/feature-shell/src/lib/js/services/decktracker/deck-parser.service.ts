import { Injectable } from '@angular/core';
import { DeckDefinition, decode, encode } from '@firestone-hs/deckstrings';
import {
	ARENAS,
	CardClass,
	GameFormat,
	GameType,
	PRACTICE_ALL,
	SCENARIO_WITHOUT_RESTART,
	ScenarioId,
	SceneMode,
	SOLO_SCENARIO_WITH_LOGGED_DECKLIST,
} from '@firestone-hs/reference-data';
import { DeckHandlerService, Metadata } from '@firestone/game-state';
import { DeckInfoFromMemory, MemoryInspectionService, MemoryUpdatesService, SceneService } from '@firestone/memory';
import { GameStatusService, getLogsDir, PreferencesService } from '@firestone/shared/common/service';
import { groupByFunction } from '@firestone/shared/framework/common';
import { ApiRunner, CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { GameEvent } from '../../models/game-event';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { getDefaultHeroDbfIdForClass, normalizeDeckHeroDbfId } from '../hs-utils';

const DECK_TEMPLATES_URL = `https://static.zerotoheroes.com/hearthstone/data/deck-templates.gz.json`;
const OPEN_BRAWL_LISTS_URL = `https://static.zerotoheroes.com/hearthstone/data/brawl_lists`;

@Injectable()
export class DeckParserService {
	public currentDeck$$ = new BehaviorSubject<DeckInfo | null>(null);

	private readonly deckNameRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ### (.*)');
	private readonly deckstringRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ([a-zA-Z0-9\\/\\+=]+)$');
	private spectating: boolean;
	private selectedDeckId: number;
	// private currentNonGamePlayScene: SceneMode;
	// private currentScene: SceneMode;
	private currentDeck: DeckInfo;

	private deckTemplates: readonly DeckTemplate[];

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
	) {
		this.init();
		window['getCurrentDeck'] = (gameType: GameType, formatType: GameFormat) =>
			this.retrieveCurrentDeck(false, {
				gameType: gameType ?? GameType.GT_PVPDR,
				formatType: formatType ?? GameFormat.FT_WILD,
				scenarioId: ScenarioId._314_ARENA_SEASON,
			});
	}

	public async getCurrentDeck(timeout?: number): Promise<DeckInfo> {
		if (!timeout) {
			return this.currentDeck;
		}
		return Promise.race([
			new Promise<DeckInfo>((resolve) => {
				const interval = setInterval(() => {
					if (this.currentDeck) {
						clearInterval(interval);
						resolve(this.currentDeck);
					}
				}, 1000);
			}),
			new Promise<DeckInfo>((resolve) => {
				setTimeout(() => {
					resolve(null);
				}, timeout);
			}),
		]);
	}

	public async retrieveCurrentDeck(usePreviousDeckIfSameScenarioId: boolean, metadata: Metadata): Promise<DeckInfo> {
		console.log(
			'[deck-parser] retrieving current deck',
			this.currentDeck,
			usePreviousDeckIfSameScenarioId,
			metadata,
		);
		if (this.spectating) {
			console.log('[deck-parser] spectating, not returning any deck');
			return null;
		}

		if (this.selectedDeckId < 0) {
			console.log(
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

		console.log(
			'[deck-parser] rebuilding deck',
			this.selectedDeckId,
			this.currentDeck?.scenarioId,
			metadata.scenarioId,
		);
		const deckFromMemory = await this.memory.getActiveDeck(this.selectedDeckId, 1);
		console.log(
			'[deck-parser] active deck from memory',
			this.selectedDeckId,
			deckFromMemory,
			this.scene.lastNonGamePlayScene$$.value,
		);
		const activeDeck = deckFromMemory;

		console.log(
			'[deck-parser] active deck',
			activeDeck,
			this.isDeckLogged(metadata.scenarioId),
			metadata.scenarioId,
			this.scene.currentScene$$.value,
		);
		let deckInfo: DeckInfo;

		// The only case where we want to reuse cached deck is when we have Restart option
		const shouldUseCachedDeck =
			metadata.gameType === GameType.GT_VS_AI && !SCENARIO_WITHOUT_RESTART.includes(metadata.scenarioId);
		if (activeDeck && activeDeck.DeckList && activeDeck.DeckList.length > 0) {
			console.log('[deck-parser] updating active deck', activeDeck, this.currentDeck);
			deckInfo = this.updateDeckFromMemory(activeDeck, metadata.scenarioId, metadata.gameType);
		} else if (
			shouldUseCachedDeck &&
			this.currentDeck?.deck &&
			// When selecting the deck in the deck selection screen, we don't have any sceanrio ID
			(this.selectedDeckId || this.currentDeck.scenarioId === metadata.scenarioId)
		) {
			console.log('[deck-parser] returning cached deck', this.currentDeck, metadata, this.selectedDeckId);
			return this.currentDeck;
		} else if (this.isDeckLogged(metadata.scenarioId)) {
			console.log('[deck-parser] trying to read previous deck from logs', metadata.scenarioId);
			deckInfo = await this.readDeckFromLogFile(metadata.scenarioId, metadata.gameType);
		} else if (metadata.gameType === GameType.GT_TAVERNBRAWL) {
			console.log('[deck-parser] trying to read tavern brawl previous deck from logs', metadata.scenarioId);
			// This could work, because it looks like that the deck is named "Brawl Deck" in all languages
			// UPDATE 2024-11-02: the pre-release Brawl Deck is named "乱斗模式套牌" in chinese
			deckInfo = await this.readDeckFromLogFile(metadata.scenarioId, metadata.gameType, [
				'Brawl Deck',
				'乱斗模式套牌',
			]);
		} else {
			console.warn('[deck-parser] could not read any deck from memory');
			deckInfo = null;
		}

		this.setCurrentDeck(deckInfo);
		return this.currentDeck;
	}

	public async getOpenDecklist(heroCardId: string, metadata: Metadata): Promise<string> {
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
		scenarioId: number,
		gameType: GameType,
		gameFormat: GameFormat,
	): Promise<DeckInfo> {
		if (this.spectating) {
			console.log('[deck-parser] spectating, not returning Whizbang deck');
			return;
		}

		// Templates are negative
		const deckTemplates = await this.getDeckTemplates();
		const deck = deckTemplates.find((deck) => +deck.DeckId === deckId || +deck.TemplateId === -deckId);
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
			const templatesFromRemote: readonly DeckTemplate[] = await this.api.callGetApi(DECK_TEMPLATES_URL);
			this.deckTemplates = (templatesFromRemote ?? [])
				.filter((template) => template.DeckList?.length)
				.map(
					(template) =>
						({
							...template,
							DeckList: template.DeckList.map((dbfId) => +dbfId),
						} as DeckTemplate),
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
					SCENARIO_WITHOUT_RESTART.includes(this.currentDeck?.scenarioId)
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
					this.selectedDeckId = null;
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
					console.log(
						'[deck-parser] getting active deck from memory after ID selection',
						this.selectedDeckId,
						activeDeck,
					);
					if (activeDeck && activeDeck.DeckList && activeDeck.DeckList.length > 0) {
						console.log(
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
						this.selectedDeckId = null;
						// Reset the cached deck, as it should only be used when restarting the match
						this.setCurrentDeck(null);
					}
				}
			}
		});

		// Init fields that are normally populated from memory reading events
		if (await this.gameStatus.inGame()) {
			this.selectedDeckId = await this.memory.getSelectedDeckId();
		}
	}

	private setCurrentDeck(deck: DeckInfo) {
		this.currentDeck = deck;
		this.currentDeck$$.next(deck);
		if (this.currentDeck) {
			console.log('[deck-parser] set current deck', this.currentDeck, JSON.stringify(this.currentDeck));
		}
	}

	private updateDeckFromMemory(
		deckFromMemory: DeckInfoFromMemory,
		scenarioId: number,
		gameType: GameType,
		gameFormat?: GameFormat,
	) {
		console.log('[deck-parser] updating deck from memory', deckFromMemory);
		if (!deckFromMemory) {
			console.error('[deck-parser] no deck to update');
			return;
		}

		const decklist: readonly number[] = normalizeWithDbfIds(deckFromMemory.DeckList, this.allCards);
		console.log('[deck-parser] normalized decklist with dbf ids', decklist, deckFromMemory.HeroCardId);
		const deckDefinition: DeckDefinition = {
			format: deckFromMemory.FormatType || gameFormat || GameFormat.FT_WILD,
			cards: explodeDecklist(decklist),
			// Add a default to avoid an exception, for cases like Dungeon Runs or whenever you have an exotic hero
			heroes: deckFromMemory.HeroCardId
				? [normalizeDeckHeroDbfId(this.allCards.getCard(deckFromMemory.HeroCardId)?.dbfId ?? 7, this.allCards)]
				: deckFromMemory.HeroClass
				? [getDefaultHeroDbfIdForClass(CardClass[deckFromMemory.HeroClass]) || 7]
				: [7],
			sideboards: !deckFromMemory.Sideboards?.length
				? null
				: deckFromMemory.Sideboards.map((sideboard) => {
						return {
							keyCardDbfId: this.allCards.getCard(sideboard.KeyCardId).dbfId,
							cards: explodeDecklist(normalizeWithDbfIds(sideboard.Cards, this.allCards)),
						};
				  }),
		};
		console.log(
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
		console.log('[deck-parser] built deck info', currentDeck);
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
		targetDeckNames: readonly string[] = null,
	): Promise<DeckInfo> {
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
			return;
		}

		if (lines.length >= 4) {
			console.log('[deck-parser] lets go', lines[lines.length - 4], 'hop', lines[lines.length - 3], gameType);
			const deckNameLogLine = lines[lines.length - 3];
			console.log('[deck-parser] deckName', deckNameLogLine);
			const deckstringLogLine = lines[lines.length - 1];
			console.log('[deck-parser] deckstring', deckstringLogLine);
			let match: RegExpExecArray;
			const deckName = (match = this.deckNameRegex.exec(deckNameLogLine)) ? match[1] : undefined;
			const deckstring = (match = this.deckstringRegex.exec(deckstringLogLine))
				? this.handler.normalizeDeckstring(match[1])
				: undefined;
			if (!!targetDeckNames?.length && !targetDeckNames.includes(deckName)) {
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
	}

	private async readAllLogLines(): Promise<readonly string[]> {
		const fileName = 'Decks.log';
		const gameInfo = await this.ow.getRunningGameInfo();
		const prefs = await this.prefs.getPreferences();
		const logsDir = await getLogsDir(this.ow, gameInfo, prefs);
		const logsLocation = `${logsDir}\\${fileName}`;
		const logsContents = await this.ow.readTextFile(logsLocation);
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

export const explodeDecklist = (initialDecklist: readonly number[]): any[] => {
	console.log('[deck-parser] decklist with dbfids', initialDecklist);
	const groupedById = groupByFunction((cardId) => '' + cardId)(initialDecklist);

	const result = Object.keys(groupedById).map((id) => [+id, groupedById[id].length]);
	console.log('[deck-parser] exploding decklist result', result);
	return result;
};

export const normalizeWithDbfIds = (
	decklist: readonly (number | string)[],
	allCards: CardsFacadeService,
): readonly number[] => {
	return decklist.map((cardId) => allCards.getCard(cardId)?.dbfId);
};

export interface DeckInfo {
	scenarioId: number;
	name: string;
	deckstring: string;
	deck: DeckDefinition;
	gameType: GameType;
}

export interface DeckTemplate extends DeckInfoFromMemory {
	TemplateId: number;
}
