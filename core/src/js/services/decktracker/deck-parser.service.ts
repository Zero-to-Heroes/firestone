import { Injectable } from '@angular/core';
import {
	ARENAS,
	CardClass,
	GameFormat,
	GameType,
	normalizeDuelsHeroCardIdForDeckCode,
	PRACTICE_ALL,
	ScenarioId,
	SCENARIO_WITHOUT_RESTART,
	SceneMode,
	SOLO_SCENARIO_WITH_LOGGED_DECKLIST,
} from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { DuelsStateBuilderService } from '@services/duels/duels-state-builder.service';
import { DeckDefinition, decode, encode } from 'deckstrings';
import { Metadata } from '../../models/decktracker/metadata';
import { GameEvent } from '../../models/game-event';
import { DeckInfoFromMemory } from '../../models/mainwindow/decktracker/deck-info-from-memory';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { ApiRunner } from '../api-runner';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { getDefaultHeroDbfIdForClass, normalizeDeckHeroDbfId } from '../hs-utils';
import { OverwolfService } from '../overwolf.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { groupByFunction } from '../utils';
import { DeckHandlerService } from './deck-handler.service';

const DECK_TEMPLATES_URL = `https://static.zerotoheroes.com/hearthstone/data/deck-templates.json?v=2`;

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

		// The only case where we want to reuse cached deck is when we have Restart option
		const shouldUseCachedDeck =
			metadata.gameType === GameType.GT_VS_AI && !SCENARIO_WITHOUT_RESTART.includes(metadata.scenarioId);
		if (
			shouldUseCachedDeck &&
			this.currentDeck?.deck &&
			// When selecting the deck in the deck selection screen, we don't have any sceanrio ID
			(this.selectedDeckId || this.currentDeck.scenarioId === metadata.scenarioId)
		) {
			console.log('[deck-parser] returning cached deck', this.currentDeck, metadata, this.selectedDeckId);
			return this.currentDeck;
		}

		// This doesn't work for Duels for instance - we keep the same sceanrio ID, but
		// need to regenerate the deck
		console.log('[deck-parser] rebuilding deck', this.currentDeck?.scenarioId, metadata.scenarioId);
		const deckFromMemory = await this.memory.getActiveDeck(this.selectedDeckId, 2);
		console.log('[deck-parser] active deck from memory', this.selectedDeckId, deckFromMemory, this.duelsDeck);
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

		console.debug(
			'[deck-parser] active deck',
			activeDeck,
			this.isDeckLogged(metadata.scenarioId),
			metadata.scenarioId,
			ARENAS,
			this.currentScene,
		);
		let deckInfo: DeckInfo;

		if (activeDeck && activeDeck.DeckList && activeDeck.DeckList.length > 0) {
			console.log('[deck-parser] updating active deck', activeDeck, this.currentDeck);
			deckInfo = this.updateDeckFromMemory(activeDeck, metadata.scenarioId, metadata.gameType);
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

	public async getWhizbangDeck(deckId: number, scenarioId: number, gameType: GameType): Promise<DeckInfo> {
		if (this.spectating) {
			console.log('[deck-parser] spectating, not returning Whizbang deck');
			return;
		}

		const deck = this.deckTemplates.find((deck) => deck.DeckId === deckId);
		console.debug('[deck-parser] found template deck', deckId, deck, this.deckTemplates);
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
		this.duelsService.duelsDeck.subscribe((deck) => {
			console.debug('[deck-parser] duels deck', deck);
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
				this.selectedDeckId = null;
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
		console.debug('[deck-parser] loaded deck templates', this.deckTemplates?.length);

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
				? [
						normalizeDeckHeroDbfId(
							// normalize for Duels
							// Still doesn't work for neutral heroes though
							this.allCards.getCard(normalizeDuelsHeroCardIdForDeckCode(deckFromMemory.HeroCardId))
								?.dbfId,
							this.allCards,
						),
				  ]
				: deckFromMemory.HeroClass
				? [getDefaultHeroDbfIdForClass(CardClass[deckFromMemory.HeroClass]) || 7]
				: [7],
		};
		console.log('[deck-parser] built deck definition', deckDefinition);
		const deckString = deckDefinition.cards.some((pair) => pair[0] == null) ? null : encode(deckDefinition);
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
		return decklist.map((cardId) => {
			const isDbfId = !isNaN(+cardId);
			const card = isDbfId ? this.allCards.getCardFromDbfId(+cardId) : this.allCards.getCard(cardId as string);
			if (!card?.dbfId) {
				console.warn(
					'[deck-parser] could not find card for dbfId',
					cardId,
					isDbfId,
					card,
					this.allCards.getCards()?.length,
				);
			}
			return card?.dbfId;
		});
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
		];
		return loggingSCenarios.includes(scenarioId);
	}

	private async readDeckFromLogFile(
		scenarioId: number,
		gameType: GameType,
		targetDeckName: string = null,
		fileName = 'Decks.log',
	): Promise<DeckInfo> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!this.ow.gameRunning(gameInfo)) {
			return;
		}
		const logsLocation = gameInfo.executionPath.split('Hearthstone.exe')[0] + 'Logs\\' + fileName;
		const logsContents = await this.ow.readTextFile(logsLocation);
		if (!logsContents) {
			return;
		}
		const lines = logsContents
			.split('\n')
			.filter((line) => line && line.length > 0)
			.map((line) => line.trim());

		if (lines.length >= 4) {
			console.log('[deck-parser] lets go', lines[lines.length - 4], 'hop', lines[lines.length - 3]);
			const deckNameLogLine = (await this.isDuelsDeck(lines[lines.length - 4]))
				? lines[lines.length - 4]
				: lines[lines.length - 3];
			const deckstringLogLine = (await this.isDuelsDeck(lines[lines.length - 4]))
				? lines[lines.length - 2]
				: lines[lines.length - 1];
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

	private async isDuelsDeck(logLine: string): Promise<boolean> {
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
		return this.currentNonGamePlayScene === SceneMode.PVP_DUNGEON_RUN;
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
