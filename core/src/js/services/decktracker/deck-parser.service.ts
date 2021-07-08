import { Injectable } from '@angular/core';
import {
	ARENAS,
	Board,
	CardClass,
	CardIds,
	GameFormat,
	GameType,
	PRACTICE_ALL,
	ReferenceCard,
	ScenarioId,
	SCENARIO_WITHOUT_RESTART,
	SceneMode,
} from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckDefinition, decode, encode } from 'deckstrings';
import { DeckCard } from '../../models/decktracker/deck-card';
import { Metadata } from '../../models/decktracker/metadata';
import { DuelsInfo } from '../../models/duels-info';
import { GameEvent } from '../../models/game-event';
import { DeckInfoFromMemory } from '../../models/mainwindow/decktracker/deck-info-from-memory';
import { MatchInfo } from '../../models/match-info';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { ApiRunner } from '../api-runner';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { getDefaultHeroDbfIdForClass } from '../hs-utils';
import { OverwolfService } from '../overwolf.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { groupByFunction } from '../utils';
import { DeckHandlerService } from './deck-handler.service';

const DECK_TEMPLATES_URL = `https://static.zerotoheroes.com/hearthstone/data/deck-templates.json?v=2`;

@Injectable()
export class DeckParserService {
	private readonly goingIntoQueueRegex = /D \d*:\d*:\d*.\d* BeginEffect blur \d => 1/g;

	private readonly deckContentsRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* Deck Contents Received(.*)');
	private readonly deckEditOverRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* Finished Editing Deck(.*)');

	private readonly deckNameRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ### (.*)');
	private readonly deckstringRegex = new RegExp('I \\d*:\\d*:\\d*.\\d* ([a-zA-Z0-9\\/\\+=]+)$');

	public currentDeck: DeckInfo = {} as DeckInfo;
	private previousDeck: any = {};
	private spectating: boolean;

	private lastDeckTimestamp;
	private currentBlock: string;

	private selectedDeckId: number;
	private currentGameType: GameType;
	private currentScenarioId: number;
	private currentNonGamePlayScene: SceneMode;
	private currentScene: SceneMode;

	private deckTemplates: readonly DeckInfoFromMemory[];

	constructor(
		private gameEvents: GameEventsEmitterService,
		private events: Events,
		private memory: MemoryInspectionService,
		private allCards: AllCardsService,
		private ow: OverwolfService,
		private handler: DeckHandlerService,
		private api: ApiRunner,
	) {
		this.init();
		window['readLog'] = async () => {
			await this.readDeckFromLogFile();
		};
	}

	private async init() {
		this.gameEvents.allEvents.subscribe((event: GameEvent) => {
			if (
				event.type === GameEvent.GAME_END ||
				(event.type === GameEvent.SPECTATING && !event.additionalData.spectating)
			) {
				console.log('[deck-parser] resetting deck after game end');
				const shouldStorePreviousDeck =
					this.currentGameType === GameType.GT_VS_AI &&
					// We actually don't want to reset in any scenario where
					// the user can restart
					!SCENARIO_WITHOUT_RESTART.includes(this.currentScenarioId);
				this.reset(shouldStorePreviousDeck);
				this.currentGameType = undefined;
				this.currentScenarioId = undefined;
			} else if (event.type === GameEvent.MATCH_METADATA) {
				this.currentGameType = event.additionalData.metaData.GameType;
				this.currentScenarioId = event.additionalData.metaData.ScenarioID;
				this.currentDeck.scenarioId = this.currentScenarioId;
				console.log(
					'[deck-parser] setting meta info',
					this.currentGameType,
					this.currentScenarioId,
					this.currentDeck,
				);
			}
			if (event.type === GameEvent.SPECTATING) {
				console.log('[deck-parser] spectating, resetting deck', event.additionalData);
				this.reset(false);
				this.currentGameType = undefined;
				this.currentScenarioId = undefined;
				this.spectating = event.additionalData.spectating;
			}
		});
		this.events.on(Events.MEMORY_UPDATE).subscribe(async (data) => {
			if (this.spectating) {
				return;
			}

			const changes: MemoryUpdate = data.data[0];
			if (changes.SelectedDeckId) {
				console.log('[deck-parser] selected deck id', changes.SelectedDeckId);
				this.selectedDeckId = changes.SelectedDeckId;
				const activeDeck = await this.memory.getActiveDeck(this.selectedDeckId, 2);
				console.log(
					'[deck-parser] getting active deck from memory after ID selection',
					this.selectedDeckId,
					activeDeck,
				);
				if (activeDeck && activeDeck.DeckList && activeDeck.DeckList.length > 0) {
					console.log('[deck-parser] updating active deck after ID selection', activeDeck, this.currentDeck);
					this.updateDeckFromMemory(activeDeck);
				}
			}
			// Resetting the selectedDeckId if empty means that if a memory update reset occurs while on
			// the deck selection screen, or simply that another memory update event occurs (which
			// will have a null selected deck)
			// Only reset when moving away from the scene where selecting a deck is possible
			else if (changes.CurrentScene && changes.CurrentScene !== SceneMode.GAMEPLAY) {
				// console.log('[deck-parser] resetting', changes.CurrentScene);
				this.selectedDeckId = null;
			}
			if (changes.CurrentScene) {
				// console.log('[deck-parser] new scene', changes.CurrentScene);
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
		this.currentNonGamePlayScene =
			this.currentNonGamePlayScene ?? (await this.memory.getCurrentSceneFromMindVision());
		console.log('[deck-parser] initial scene', this.currentNonGamePlayScene);
	}

	public async queueingIntoMatch(logLine: string) {
		// console.log(
		// 	'[deck-parser] will detect active deck from queue?',
		// 	logLine,
		// 	this.currentGameType,
		// 	this.selectedDeckId,
		// );
		if (this.spectating) {
			console.log('[deck-parser] spectating, not handling queue into match');
			return;
		}

		if (this.goingIntoQueueRegex.exec(logLine)) {
			if (
				this.currentGameType === GameType.GT_BATTLEGROUNDS ||
				this.currentGameType === GameType.GT_BATTLEGROUNDS_FRIENDLY
			) {
				// console.debug('BG game, returning');
				return;
			}

			// Don't retrieve the deck when leaving the gameplay mode
			// Otherwise, we get the deck from memory, then cache it, and then next time we want to
			// play with another deck we just use the cache and load the wrongly cached deck
			if (this.currentScene === SceneMode.GAMEPLAY) {
				console.log('[deck-parser] leaving game, not re-reading deck from memory');
				return;
			}

			if (this.currentScene === SceneMode.BACON || this.currentNonGamePlayScene === SceneMode.BACON) {
				console.debug('BACON scene, returning');
				return;
			}

			// Don't refresh the deck when leaving the match
			// However scene_gameplay is also the current scene when selecting a friendly deck?
			if (!this.currentNonGamePlayScene || this.currentNonGamePlayScene === SceneMode.GAMEPLAY) {
				return;
			}
			console.log('[deck-parser] getting active deck from going into queue', this.currentNonGamePlayScene);

			// We get this as soon as possible, since once the player has moved out from the
			// dekc selection screen the info becomes unavailable
			console.log('[deck-parser] reading deck from memory');
			const [deckFromMemory] = await Promise.all([this.memory.getActiveDeck(this.selectedDeckId, 1)]);
			console.log('[deck-parser] deck from memory', deckFromMemory, this.currentNonGamePlayScene);

			// Duels info is available throughout the whole match, so we don't need to aggressively retrieve it
			const activeDeck =
				this.currentNonGamePlayScene === SceneMode.PVP_DUNGEON_RUN ? await this.getDuelsInfo() : deckFromMemory;
			console.log('[deck-parser] active deck after queue', activeDeck, this.currentNonGamePlayScene);
			if (!activeDeck) {
				console.warn('[deck-parser] could not read any deck from memory');
				return;
			}
			if (this.isDuelsInfo(activeDeck) && activeDeck.Wins === 0 && activeDeck.Losses === 0) {
				console.log('[deck-parser] not relying on memory reading for initial Duels deck, returning');
				this.reset(false);
				return;
			}
			if (activeDeck.DeckList && activeDeck.DeckList.length > 0) {
				console.log(
					'[deck-parser] updating active deck after queue',
					activeDeck,
					this.currentDeck,
					this.currentScenarioId,
				);
				this.updateDeckFromMemory(activeDeck);
				this.currentDeck.scenarioId = this.currentScenarioId;
			}
		}
	}

	private isDuelsInfo(activeDeck: DeckInfoFromMemory | DuelsInfo): activeDeck is DuelsInfo {
		return (activeDeck as DuelsInfo).Wins !== undefined;
	}

	private async getDuelsInfo(): Promise<DuelsInfo> {
		let result = await this.memory.getDuelsInfo(false, 3);
		if (!result) {
			result = await this.memory.getDuelsInfo(true, 3);
		}
		return result;
	}

	public async getCurrentDeck(usePreviousDeckIfSameScenarioId: boolean, metadata: Metadata): Promise<any> {
		if (this.spectating) {
			console.log('[deck-parser] spectating, not returning any deck');
			return null;
		}

		const shouldUseCachedDeck = metadata.gameType !== GameType.GT_VS_AI;
		console.log(
			'[deck-parser] getting current deck',
			this.currentDeck,
			usePreviousDeckIfSameScenarioId,
			shouldUseCachedDeck,
			metadata,
			this.previousDeck,
		);
		if (shouldUseCachedDeck && this.currentDeck?.deck) {
			console.log('[deck-parser] returning cached deck', this.currentDeck);
			return this.currentDeck;
		}
		if (
			(!this.currentDeck || !this.currentDeck.deck) &&
			usePreviousDeckIfSameScenarioId &&
			metadata.scenarioId === this.previousDeck.scenarioId
		) {
			console.log('[deck-parser] using previous deck');
			this.currentDeck = this.previousDeck;
		}
		if (this.memory) {
			console.log('[deck-parser] ready to get active deck');
			const activeDeck = await this.memory.getActiveDeck(this.selectedDeckId, 2);
			console.log('[deck-parser] active deck from memory', this.selectedDeckId, activeDeck);
			if (activeDeck && activeDeck.DeckList && activeDeck.DeckList.length > 0) {
				console.log('[deck-parser] updating active deck', activeDeck, this.currentDeck);
				this.updateDeckFromMemory(activeDeck);
			}
		}
		// console.log(
		// 	'[deck-parser] should try to read deck from logs?',
		// 	scenarioId,
		// 	this.isDeckLogged(scenarioId),
		// 	this.currentDeck?.deck,
		// );
		if (!this.currentDeck?.deck && this.isDeckLogged(metadata.scenarioId)) {
			console.log('[deck-parser] trying to read previous deck from logs', metadata.scenarioId);
			await this.readDeckFromLogFile();
		}
		console.log('[deck-parser] returning current deck', this.currentDeck);
		return this.currentDeck;
	}

	public async getWhizbangDeck(deckId: number) {
		if (this.spectating) {
			console.log('[deck-parser] spectating, not returning Whizbang deck');
			return;
		}

		const deck = this.deckTemplates.find((deck) => deck.DeckId === deckId);
		console.debug('[deck-parser] found template deck', deckId, deck, this.deckTemplates);
		if (deck && deck.DeckList && deck.DeckList.length > 0) {
			console.log('[deck-parser] updating active deck 2', deck, this.currentDeck);
			this.updateDeckFromMemory(deck);
		}
		return this.currentDeck;
	}

	private updateDeckFromMemory(deckFromMemory: DeckInfoFromMemory) {
		console.log('[deck-parser] updating deck from memory', deckFromMemory);
		if (!deckFromMemory) {
			console.error('[deck-parser] no deck to update');
			return;
		}

		const decklist: readonly number[] = this.normalizeWithDbfIds(deckFromMemory.DeckList);
		console.log('[deck-parser] normalized decklist with dbf ids', decklist, deckFromMemory.HeroCardId);
		this.currentDeck.deck = {
			format: deckFromMemory.FormatType || GameFormat.FT_WILD,
			cards: this.explodeDecklist(decklist),
			// Add a default to avoid an exception, for cases like Dungeon Runs or whenever you have an exotic hero
			heroes: deckFromMemory.HeroCardId
				? [this.normalizeHero(this.allCards.getCard(deckFromMemory.HeroCardId)?.dbfId) || 7]
				: deckFromMemory.HeroClass
				? [getDefaultHeroDbfIdForClass(CardClass[deckFromMemory.HeroClass]) || 7]
				: [7],
		};
		this.currentDeck.name = deckFromMemory.Name ?? this.currentDeck.name;
		console.log('[deck-parser] building deckstring', this.currentDeck.deck);
		const deckString = encode(this.currentDeck.deck);
		console.log('[deck-parser] built deckstring', deckString);
		this.currentDeck.deckstring = this.normalizeDeckstring(deckString);
		console.log('[deck-parser] updated deck with deckstring', this.currentDeck.deckstring);
	}

	private normalizeWithDbfIds(decklist: readonly (number | string)[]): readonly number[] {
		return decklist.map((cardId) => {
			const isDbfId = !isNaN(+cardId);
			const card = isDbfId ? this.allCards.getCardFromDbfId(+cardId) : this.allCards.getCard(cardId as string);
			if (!card?.dbfId) {
				console.warn('[deck-parser] could not find card for dbfId', cardId, isDbfId);
			}
			return card?.dbfId;
		});
	}

	private isDeckLogged(scenarioId: number): boolean {
		return [...PRACTICE_ALL, ARENAS, ScenarioId.STANDARD_1_VS_1_GAME, ScenarioId.WIZARD_DUELS].includes(scenarioId);
	}

	private async readDeckFromLogFile(fileName = 'Decks.log'): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!this.ow.gameRunning(gameInfo)) {
			return;
		}
		const logsLocation = gameInfo.executionPath.split('Hearthstone.exe')[0] + 'Logs\\' + fileName;
		const logsContents = await this.ow.getFileContents(logsLocation);
		if (!logsContents) {
			return;
		}
		const lines = logsContents
			.split('\n')
			.filter((line) => line && line.length > 0)
			.map((line) => line.trim());
		// console.debug('[deck-parser] reading deck contents', lines);
		if (lines.length >= 4) {
			console.log('[deck-parser] lets go', lines[lines.length - 4], 'hop', lines[lines.length - 3]);
			const isLastSectionDeckSelectLine =
				lines[lines.length - 4].indexOf('Finding Game With Hero:') !== -1 ||
				lines[lines.length - 4].indexOf('Finding Game With Deck:') !== -1 ||
				(await this.isDuelsDeck(lines[lines.length - 4])) ||
				(await this.isDuelsDeck(lines[lines.length - 3]));
			if (!isLastSectionDeckSelectLine) {
				console.log('[deck-parser] not a deck selection', [...lines].reverse().slice(0, 4).join(','));
				return;
			}
			// deck name
			this.parseActiveDeck(
				// lines[lines.length - 4].indexOf('Duels Deck') !== -1
				(await this.isDuelsDeck(lines[lines.length - 4])) ? lines[lines.length - 4] : lines[lines.length - 3],
			);
			// deckstring
			this.parseActiveDeck(
				(await this.isDuelsDeck(lines[lines.length - 4])) ? lines[lines.length - 2] : lines[lines.length - 1],
			);
			console.log('[deck-parser] finished reading previous deck from logs');
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
		console.debug('[deck-parser] current scene', this.currentNonGamePlayScene);
		return this.currentNonGamePlayScene === SceneMode.PVP_DUNGEON_RUN;
	}

	private explodeDecklist(initialDecklist: readonly number[]): any[] {
		console.log('[deck-parser] decklist with dbfids', initialDecklist);
		const groupedById = groupByFunction((cardId) => '' + cardId)(initialDecklist);
		// console.log('[deck-parser] groupedById', groupedById);
		const result = Object.keys(groupedById).map((id) => [+id, groupedById[id].length]);
		console.log('[deck-parser] exploding decklist result', result);
		return result;
	}

	public parseActiveDeck(data: string) {
		let match = this.deckContentsRegex.exec(data);
		if (match) {
			this.lastDeckTimestamp = Date.now();
			this.currentBlock = 'DECK_CONTENTS';
			console.log('[deck-parser] finished listing deck content');
			return;
		}
		match = this.deckEditOverRegex.exec(data);
		if (match) {
			this.lastDeckTimestamp = Date.now();
			this.currentBlock = 'DECK_EDIT_OVER';
			console.log('[deck-parser] finished editing deck');
			return;
		}
		if (
			data.indexOf('Finding Game With Deck') !== -1 ||
			data.indexOf('Finding Game With Hero') !== -1 ||
			data.indexOf('Duels deck') !== -1
		) {
			this.lastDeckTimestamp = Date.now();
			this.currentBlock = 'DECK_SELECTED';
			console.log('[deck-parser] found deck selection block');
			return;
		}

		if (
			this.lastDeckTimestamp &&
			Date.now() - this.lastDeckTimestamp < 1000 &&
			this.currentBlock !== 'DECK_SELECTED'
		) {
			// console.log(
			// 	'[deck-parser] Doesnt look like a deck selection, exiting block',
			// 	this.currentBlock,
			// 	this.lastDeckTimestamp,
			// 	Date.now(),
			// );
			// Don't reset the deck here, as it can override a deck built from memory inspection
			// this.reset();
			return;
		}

		console.log('[deck-parser] received log line', data);
		match = this.deckNameRegex.exec(data);
		if (match) {
			// console.log('[deck-parser] matching log line for deck name', data);
			this.currentDeck = {
				name: match[1],
				scenarioId: this.currentScenarioId,
			} as DeckInfo;
			console.log('[deck-parser] deck init', this.currentDeck);
			return;
		}
		match = this.deckstringRegex.exec(data);
		if (match) {
			console.log('[deck-parser] parsing deckstring', match);
			this.currentDeck =
				this.currentDeck ||
				({
					scenarioId: this.currentScenarioId,
				} as DeckInfo);
			this.currentDeck.deckstring = this.normalizeDeckstring(match[1]);
			console.log('[deck-parser] current deck', this.currentDeck);
			this.decodeDeckString();
			console.log('[deck-parser] deckstring decoded', this.currentDeck);
			return;
		}
	}

	private decodeDeckString() {
		if (this.currentDeck) {
			if (this.currentDeck.deckstring) {
				const deck = decode(this.currentDeck.deckstring);
				this.currentDeck.deck = deck;
				return;
			} else {
				this.currentDeck.deck = undefined;
			}
		}
	}

	// By doing this we make sure we don't get a leftover deckstring caused by
	// a game mode that doesn't interact with the Decks.log
	public reset(shouldStorePreviousDeck: boolean) {
		// Keeping the previous deck is useful for modes where you can just restart, eg practice
		if (shouldStorePreviousDeck && this.currentDeck?.deck) {
			this.previousDeck = this.currentDeck;
		}
		this.currentDeck = {} as DeckInfo;
		console.log('[deck-parser] resetting deck', shouldStorePreviousDeck, this.currentDeck, this.previousDeck);
	}

	public buildDeck(currentDeck: any): readonly DeckCard[] {
		if (currentDeck && currentDeck.deckstring) {
			return this.buildDeckList(currentDeck.deckstring);
		}
		if (!currentDeck || !currentDeck.deck) {
			return [];
		}
		return (
			currentDeck.deck.cards
				// [dbfid, count] pair
				.map((pair) => this.buildDeckCards(pair))
				.reduce((a, b) => a.concat(b), [])
				.sort((a: DeckCard, b: DeckCard) => a.manaCost - b.manaCost)
		);
	}

	public buildDeckList(deckstring: string, deckSize = 30): readonly DeckCard[] {
		return this.handler.buildDeckList(deckstring, deckSize);
	}

	public buildEmptyDeckList(deckSize = 30): readonly DeckCard[] {
		return this.handler.buildEmptyDeckList(deckSize);
	}

	public async postProcessDeck(deck: readonly DeckCard[]): Promise<readonly DeckCard[]> {
		if (!deck || deck.length === 0) {
			return deck;
		}
		// console.log('postprocessing', deck);
		const matchInfo = await this.memory.getMatchInfo();
		return deck.map((decKCard) => this.postProcessDeckCard(decKCard, matchInfo));
	}

	private postProcessDeckCard(deckCard: DeckCard, matchInfo: MatchInfo): DeckCard {
		const newCardId = this.updateCardId(deckCard.cardId, matchInfo);
		if (newCardId === deckCard.cardId) {
			return deckCard;
		}
		const newCard = this.allCards.getCard(newCardId);
		return deckCard.update({
			cardId: newCard.id,
			cardName: newCard.name,
		} as DeckCard);
	}

	private updateCardId(cardId: string, matchInfo: MatchInfo): string {
		if (cardId !== CardIds.Collectible.Neutral.TransferStudent || !matchInfo) {
			return cardId;
		}

		// Don't use generated card ids here, as they are changing all the time
		switch (matchInfo.boardId) {
			case Board.STORMWIND:
				return 'SCH_199t';
			case Board.ORGRIMMAR:
				return 'SCH_199t2';
			case Board.PANDARIA:
				return 'SCH_199t3';
			case Board.STRANGLETHORN:
				return 'SCH_199t4';
			case Board.NAXXRAMAS:
				return 'SCH_199t5';
			case Board.GOBLINS_VS_GNOMES:
				return 'SCH_199t6';
			case Board.BLACKROCK_MOUNTAIN:
				return 'SCH_199t7';
			case Board.THE_GRAND_TOURNAMENT:
				return 'SCH_199t8';
			case Board.THE_MUSEUM:
				return 'SCH_199t9';
			case Board.EXCAVATION_SITE:
				return 'SCH_199t24';
			case Board.STORMWIND_OLD_GODS:
				return 'SCH_199t10';
			case Board.KARAZHAN:
				return 'SCH_199t11';
			case Board.MEAN_STREETS_OF_GADGETZAN:
				return 'SCH_199t12';
			case Board.UNGORO:
				return 'SCH_199t13';
			case Board.FROZEN_THRONE:
				return 'SCH_199t14';
			case Board.KOBOLDS_AND_CATACOMBS:
				return 'SCH_199t15';
			case Board.THE_WITCHWOOD:
				return 'SCH_199t16';
			case Board.BOOMSDAY:
				return 'SCH_199t17';
			case Board.RASTAKHANS_RUMBLE:
				return 'SCH_199t18';
			case Board.DALARAN:
				return 'SCH_199t19';
			case Board.SAVIORS_OF_ULDUM:
				return 'SCH_199t20';
			case Board.SAVIORS_OF_ULDUM_ALT:
				return 'SCH_199t25';
			case Board.DRAGONS:
				return 'SCH_199t21';
			case Board.ASHES_OF_OUTLANDS:
				return 'SCH_199t22';
			case Board.SCHOLOMANCE:
				return 'SCH_199t23';
			case Board.DARKMOON_FAIRE:
				return 'SCH_199t26';
			case Board.BARRENS:
				return 'SCH_199t27';
			default:
				return cardId;
		}
	}

	public buildDeckCards(pair): DeckCard[] {
		return this.handler.buildDeckCards(pair);
	}

	public normalizeDeckstring(deckstring: string, heroCardId?: string): string {
		try {
			// console.log('normalizing deckstring', deckstring, heroCardId);
			const deck = decode(deckstring);
			// console.log('deck from deckstring', deckstring, deck);
			deck.heroes = deck.heroes?.map((heroDbfId) => this.normalizeHero(heroDbfId, heroCardId));
			const newDeckstring = encode(deck);
			// console.log('normalized deck', newDeckstring, deck);
			return newDeckstring;
		} catch (e) {
			if (deckstring) {
				console.warn('trying to normalize invalid deckstring', deckstring, e);
			}
			return deckstring;
		}
	}

	private normalizeHero(heroDbfId: number, heroCardId?: string): number {
		let card: ReferenceCard;
		// console.debug('normalizing hero', heroDbfId, heroCardId);
		if (heroDbfId) {
			card = this.allCards.getCardFromDbfId(+heroDbfId);
		}
		// console.debug('found card for hero', card);
		if (!card || !card.id) {
			// console.debug('fallbacking to heroCardId', heroCardId);
			card = this.allCards.getCard(heroCardId);
			if (!card || !card.id) {
				return heroDbfId;
			}
		}

		const playerClass: string = this.allCards.getCard(card.id)?.playerClass;
		return getDefaultHeroDbfIdForClass(playerClass);
	}
}

export interface DeckInfo {
	scenarioId: number;
	name: string;
	deckstring: string;
	deck: DeckDefinition;
}
