import { Injectable } from '@angular/core';
import { DeckDefinition, decode, encode } from '@firestone-hs/deckstrings';
import {
	ARENAS,
	CardClass,
	GameFormat,
	GameType,
	PRACTICE_ALL,
	ScenarioId,
	SCENARIO_WITHOUT_RESTART,
	SceneMode,
	SOLO_SCENARIO_WITH_LOGGED_DECKLIST,
} from '@firestone-hs/reference-data';
import { ApiRunner, CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { DuelsStateBuilderService } from '@services/duels/duels-state-builder.service';
import { Metadata } from '../../models/decktracker/metadata';
import { GameEvent } from '../../models/game-event';
import { DeckInfoFromMemory } from '../../models/mainwindow/decktracker/deck-info-from-memory';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { getDefaultHeroDbfIdForClass, normalizeDeckHeroDbfId } from '../hs-utils';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { groupByFunction } from '../utils';
import { DeckHandlerService } from './deck-handler.service';

const DECK_TEMPLATES_URL = `https://static.zerotoheroes.com/hearthstone/data/deck-templates.json`;

@Injectable()
export class DeckParserService {
	// We store this separately because we retrieve it with a different timing (we have to
	// get it from the hub screen, instead of when moving away to the match)
	public duelsDeck: DeckInfoFromMemory;

	private readonly deckNameRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ### (.*)');
	private readonly deckstringRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ([a-zA-Z0-9\\/\\+=]+)$');
	private spectating: boolean;
	private selectedDeckId: number;
	private currentNonGamePlayScene: SceneMode;
	private currentScene: SceneMode;
	private currentDeck: DeckInfo;

	private deckTemplates: readonly DeckInfoFromMemory[];

	constructor(
		private readonly gameEvents: GameEventsEmitterService,
		private readonly events: Events,
		private readonly memory: MemoryInspectionService,
		private readonly allCards: CardsFacadeService,
		private readonly ow: OverwolfService,
		private readonly handler: DeckHandlerService,
		private readonly api: ApiRunner,
		private readonly duelsService: DuelsStateBuilderService,
	) {
		this.init();
		window['getCurrentDeck'] = (gameType: GameType, formatType: GameFormat) =>
			this.retrieveCurrentDeck(false, {
				gameType: gameType ?? GameType.GT_PVPDR,
				formatType: formatType ?? GameFormat.FT_WILD,
				scenarioId: ScenarioId.WIZARD_DUELS,
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
			return this.getTemplateDeck(this.selectedDeckId, metadata.scenarioId, metadata.gameType);
		}

		// This doesn't work for Duels for instance - we keep the same sceanrio ID, but
		// need to regenerate the deck
		console.log('[deck-parser] rebuilding deck', this.currentDeck?.scenarioId, metadata.scenarioId);
		const deckFromMemory = await this.memory.getActiveDeck(this.selectedDeckId, 4);
		console.log(
			'[deck-parser] active deck from memory',
			this.selectedDeckId,
			deckFromMemory,
			this.duelsDeck,
			this.currentNonGamePlayScene,
		);
		const activeDeck =
			(this.currentNonGamePlayScene === SceneMode.PVP_DUNGEON_RUN ? this.duelsDeck : deckFromMemory) ??
			deckFromMemory;
		// console.log('[deck-parser] active deck after duels', activeDeck, this.currentNonGamePlayScene);
		// if (this.isDuelsInfo(activeDeck)) {
		// 	activeDeck = {
		// 		...activeDeck,
		// 		// Give priority to the cardIds, as this is what we get when reading the duels deck
		// 		// from the main Duels manager, instead of the dungeon run scene
		// 		DeckList: activeDeck.DeckListWithCardIds ?? activeDeck.DeckList,
		// 	};
		// }

		console.log(
			'[deck-parser] active deck',
			activeDeck,
			this.isDeckLogged(metadata.scenarioId),
			metadata.scenarioId,
			ARENAS,
			this.currentScene,
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
			deckInfo = await this.readDeckFromLogFile(metadata.scenarioId, metadata.gameType, 'Brawl Deck');
		} else {
			console.warn('[deck-parser] could not read any deck from memory');
			deckInfo = null;
		}
		this.currentDeck = deckInfo;
		console.log('[deck-parser] set current deck', this.currentDeck, JSON.stringify(this.currentDeck));
		return this.currentDeck;
	}

	public async getTemplateDeck(deckId: number, scenarioId: number, gameType: GameType): Promise<DeckInfo> {
		if (this.spectating) {
			console.log('[deck-parser] spectating, not returning Whizbang deck');
			return;
		}

		// Templates are negative
		const deck = this.deckTemplates.find((deck) => deck.DeckId === deckId || deck.Id === -deckId);
		console.debug('[deck-parser] deckTemplate', deckId, deck);
		if (deck && deck.DeckList && deck.DeckList.length > 0) {
			console.log('[deck-parser] updating active deck 2', deck, this.currentDeck);
			this.currentDeck = this.updateDeckFromMemory(deck, scenarioId, gameType);
		} else {
			this.currentDeck = null;
		}
		return this.currentDeck;
	}

	private async init() {
		this.gameEvents.allEvents.subscribe((event: GameEvent) => {
			if (event.type === GameEvent.SPECTATING) {
				console.log('[deck-parser] spectating, resetting deck', event.additionalData);
				this.spectating = event.additionalData.spectating;
				this.currentDeck = {} as DeckInfo;
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
					this.currentDeck = {} as DeckInfo;
					// In some cases, the "selected deck" memory event is not fired when switching decks (I don't know why though)
					// So it's probably safer to reset the selected deck id, since normally the event is also fired when the
					// deck is not changed
					this.selectedDeckId = null;
				}
			}
		});
		this.duelsService.duelsInfo$$.subscribe((deck) => {
			console.debug('[duels] got deck', deck);
			this.duelsDeck = deck;
		});

		this.events.on(Events.MEMORY_UPDATE).subscribe(async (data) => {
			if (this.spectating) {
				console.log('[deck-parser] spectating, not registering memory update');
				return;
			}

			const changes: MemoryUpdate = data.data[0];
			if (changes.SelectedDeckId) {
				console.log('[deck-parser] selected deck id', changes.SelectedDeckId);
				this.selectedDeckId = changes.SelectedDeckId;
				const activeDeck = await this.memory.getActiveDeck(this.selectedDeckId, 2, true);
				console.log(
					'[deck-parser] getting active deck from memory after ID selection',
					this.selectedDeckId,
					activeDeck,
				);
				if (activeDeck && activeDeck.DeckList && activeDeck.DeckList.length > 0) {
					console.log('[deck-parser] updating active deck after ID selection', activeDeck, this.currentDeck);
					this.currentDeck = this.updateDeckFromMemory(activeDeck, null, null);
				}
			}
			// Resetting the selectedDeckId if empty means that if a memory update reset occurs while on
			// the deck selection screen, or simply that another memory update event occurs (which
			// will have a null selected deck)
			// Only reset when moving away from the scene where selecting a deck is possible
			else if (changes.CurrentScene && changes.CurrentScene !== SceneMode.GAMEPLAY) {
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
						changes.CurrentScene !== SceneMode.LOGIN
					) {
						this.selectedDeckId = null;
						// Reset the cached deck, as it should only be used when restarting the match
						this.currentDeck = null;
					}
				}
			}
			if (changes.CurrentScene) {
				this.currentNonGamePlayScene =
					!changes.CurrentScene || changes.CurrentScene === SceneMode.GAMEPLAY
						? this.currentNonGamePlayScene
						: changes.CurrentScene;
				this.currentScene = changes.CurrentScene;
			}
		});
		const templatesFromRemote: readonly any[] = await this.api.callGetApi(DECK_TEMPLATES_URL);
		this.deckTemplates = (templatesFromRemote ?? [])
			.filter((template) => template.DeckList?.length)
			.map(
				(template) =>
					({
						...template,
						DeckList: template.DeckList.map((dbfId) => +dbfId),
					} as DeckInfoFromMemory),
			);

		// Init fields that are normally populated from memory reading events
		this.currentNonGamePlayScene =
			this.currentNonGamePlayScene ?? (await this.memory.getCurrentSceneFromMindVision());
		console.log('[deck-parser] initial scene', this.currentNonGamePlayScene);
		this.selectedDeckId = await this.memory.getSelectedDeckId();
	}

	// private isDuelsInfo(activeDeck: DeckInfoFromMemory | DuelsInfo): activeDeck is DuelsInfo {
	// 	return (activeDeck as DuelsInfo)?.Wins !== undefined;
	// }

	// private async getDuelsInfo(): Promise<DuelsInfo> {
	// 	let result = await this.memory.getDuelsInfo(false, 3);
	// 	if (!result) {
	// 		result = await this.memory.getDuelsInfo(true, 3);
	// 	}
	// 	return result;
	// }

	private updateDeckFromMemory(deckFromMemory: DeckInfoFromMemory, scenarioId: number, gameType: GameType) {
		console.log('[deck-parser] updating deck from memory', deckFromMemory);
		if (!deckFromMemory) {
			console.error('[deck-parser] no deck to update');
			return;
		}

		const decklist: readonly number[] = this.normalizeWithDbfIds(deckFromMemory.DeckList);
		console.log('[deck-parser] normalized decklist with dbf ids', decklist, deckFromMemory.HeroCardId);
		const deckDefinition: DeckDefinition = {
			format: deckFromMemory.FormatType || GameFormat.FT_WILD,
			cards: this.explodeDecklist(decklist),
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
							cards: this.explodeDecklist(this.normalizeWithDbfIds(sideboard.Cards)),
						};
				  }),
		};
		console.log(
			'[deck-parser] built deck definition',
			deckFromMemory.HeroCardId,
			deckFromMemory.HeroClass,
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

	private normalizeWithDbfIds(decklist: readonly (number | string)[]): readonly number[] {
		return decklist.map((cardId) => this.allCards.getCard(cardId)?.dbfId);
	}

	private isDeckLogged(scenarioId: number): boolean {
		const loggingSCenarios: readonly number[] = [
			...PRACTICE_ALL,
			...ARENAS,
			...SOLO_SCENARIO_WITH_LOGGED_DECKLIST,
			ScenarioId.STANDARD_1_VS_1_GAME,
			ScenarioId.WIZARD_DUELS,
			ScenarioId.WIZARD_DUELS___ALTERAC_VALLEY,
			ScenarioId.WIZARD_DUELS___ALTERAC_VALLEY_HEROES,
			ScenarioId.WIZARD_DUELS___REVENDRETH,
			ScenarioId.WIZARD_DUELS___THE_SUNKEN_CITY,
			ScenarioId.WIZARD_DUELS___DEATH_KNIGHT,
			ScenarioId.TAVERN_BRAWL_BRAWLISEUM,
			ScenarioId.TAVERN_BRAWL_WILD_BRAWLISEUM,
		];
		return loggingSCenarios.includes(scenarioId);
	}

	private async readDeckFromLogFile(
		scenarioId: number,
		gameType: GameType,
		targetDeckName: string = null,
	): Promise<DeckInfo> {
		const lines: readonly string[] = await this.readAllLogLines();

		// ignore everythine if the lines don't contain any "finding game with deck"
		// this means that we're reconnecting and that have just received the full list of decks
		// TODO: test other languages
		if (
			!lines.some((line) => line.includes('Finding Game With Deck')) &&
			!lines.some((line) => line.includes('Finding Game With Hero'))
		) {
			console.log('[deck-parser] ignoring deck log lines because there is no "finding game with deck"');
			return;
		}

		if (lines.length >= 4) {
			console.log('[deck-parser] lets go', lines[lines.length - 4], 'hop', lines[lines.length - 3], gameType);
			const deckNameLogLine = (await this.isDuelsDeck(lines[lines.length - 4], gameType))
				? lines[lines.length - 4]
				: lines[lines.length - 3];
			console.log('[deck-parser] deckName', deckNameLogLine);
			const deckstringLogLine = (await this.isDuelsDeck(lines[lines.length - 4], gameType))
				? lines[lines.length - 2]
				: lines[lines.length - 1];
			console.log('[deck-parser] deckstring', deckstringLogLine);
			let match: RegExpExecArray;
			const deckName = (match = this.deckNameRegex.exec(deckNameLogLine)) ? match[1] : undefined;
			const deckstring = (match = this.deckstringRegex.exec(deckstringLogLine))
				? this.handler.normalizeDeckstring(match[1])
				: undefined;
			if (targetDeckName && deckName !== targetDeckName) {
				console.log('[deck-parser] deck name does not match', deckName, targetDeckName);
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
		if (!this.ow.gameRunning(gameInfo)) {
			return [];
		}
		const logsLocation = gameInfo.executionPath.split('Hearthstone.exe')[0] + 'Logs\\' + fileName;
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

	private async isDuelsDeck(logLine: string, gameType: GameType): Promise<boolean> {
		if (!logLine?.length) {
			return false;
		}
		// The "Duels deck" name in fact only appears in English.
		// But we at least check that we have a deck name...
		if (!logLine.includes('###')) {
			return false;
		}
		// ...and that we are on the Duels screen
		console.log('[deck-parser] current scene', this.currentNonGamePlayScene);
		return (
			this.currentNonGamePlayScene === SceneMode.PVP_DUNGEON_RUN ||
			// In case we launch the app mid-game
			(this.currentScene === SceneMode.GAMEPLAY && [GameType.GT_PVPDR, GameType.GT_PVPDR_PAID].includes(gameType))
		);
	}

	private explodeDecklist(initialDecklist: readonly number[]): any[] {
		console.log('[deck-parser] decklist with dbfids', initialDecklist);
		const groupedById = groupByFunction((cardId) => '' + cardId)(initialDecklist);

		const result = Object.keys(groupedById).map((id) => [+id, groupedById[id].length]);
		console.log('[deck-parser] exploding decklist result', result);
		return result;
	}

	// By doing this we make sure we don't get a leftover deckstring caused by
	// a game mode that doesn't interact with the Decks.log
	// public reset(shouldStorePreviousDeck: boolean) {
	// 	// Keeping the previous deck is useful for modes where you can just restart, eg practice
	// 	if (shouldStorePreviousDeck && this.currentDeck?.deck) {
	// 		this.previousDeck = this.currentDeck;
	// 	}
	// 	this.currentDeck = {} as DeckInfo;
	// 	console.log('[deck-parser] resetting deck', shouldStorePreviousDeck, this.currentDeck, this.previousDeck);
	// }
}

export interface DeckInfo {
	scenarioId: number;
	name: string;
	deckstring: string;
	deck: DeckDefinition;
	gameType: GameType;
}
