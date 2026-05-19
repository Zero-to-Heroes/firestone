import { Injectable } from '@angular/core';
import { Map } from 'immutable';
import { Observable } from 'rxjs';
import { Game } from '../models/game/game';
import { HistoryItem } from '../models/history/history-item';
import { ActionParserConfig, GameHistoryItem } from '../models/models';
import { AllCardsService } from './all-cards.service';
import { GamePopulationService } from './entitiespipeline/game-population.service';
import { GameStateParserService } from './entitiespipeline/game-state-parser.service';
import { ActionParserService } from './gamepipeline/action-parser.service';
import { ActivePlayerParserService } from './gamepipeline/active-player-parser.service';
import { ActiveSpellParserService } from './gamepipeline/active-spell-parser.service';
import { EndGameParserService } from './gamepipeline/end-game-parser.service';
import { GameInitializerService } from './gamepipeline/game-initializer.service';
import { MulliganParserService } from './gamepipeline/mulligan-parser.service';
import { NarratorService } from './gamepipeline/narrator.service';
import { TargetsParserService } from './gamepipeline/targets-parser.service';
import { TurnParserService } from './gamepipeline/turn-parser.service';
import { ImagePreloaderService } from './image-preloader.service';
import { ReplayPerfService } from './replay-perf.service';
import { StateProcessorService } from './state-processor.service';
import { ReplayIndex, ReplayIndexMeta } from '../models/replay-index';
import { extractMeta, finalizeReplayIndex } from './replay-index-builder';
import { ReplayTurnCacheService } from './replay-turn-cache.service';
import { XmlParserService } from './xml-parser.service';

const DEFAULT_YIELD_MS = 15;

@Injectable({
	providedIn: 'root',
})
export class GameParserService {
	constructor(
		private allCards: AllCardsService,
		private actionParser: ActionParserService,
		private turnParser: TurnParserService,
		private imagePreloader: ImagePreloaderService,
		private gamePopulationService: GamePopulationService,
		private gameStateParser: GameStateParserService,
		private gameInitializer: GameInitializerService,
		private activePlayerParser: ActivePlayerParserService,
		private activeSpellParser: ActiveSpellParserService,
		private targetsParser: TargetsParserService,
		private mulliganParser: MulliganParserService,
		private endGameParser: EndGameParserService,
		private narrator: NarratorService,
		private stateProcessor: StateProcessorService,
		private replayPerf: ReplayPerfService,
		private turnCache: ReplayTurnCacheService,
	) {}
	private cancelled: boolean;
	private processingTimeout;
	private activeIndex: ReplayIndex | null = null;
	private activeConfig: ActionParserConfig = new ActionParserConfig();
	private activeActionParsers: ReturnType<ActionParserService['createParsers']> | null = null;

	public async parse(
		replayAsString: string,
		options?: TechnicalParsingOptions,
		config: ActionParserConfig = new ActionParserConfig(),
	): Promise<Observable<[Game, string, boolean]>> {
		const start = Date.now();
		this.cancelled = false;
		if (this.processingTimeout) {
			clearTimeout(this.processingTimeout);
			this.processingTimeout = undefined;
		}

		this.replayPerf.markXmlSize(replayAsString?.length ?? 0);
		this.replayPerf.startParse();

		const indexPromise =
			options?.prebuiltIndex != null
				? Promise.resolve(options.prebuiltIndex)
				: (options?.prebuiltIndexPromise ?? Promise.resolve(null));

		const cardsPromise = !this.allCards.getCards()?.length
			? (async () => {
					const cardsStart = Date.now();
					await this.allCards.initializeCardsDb();
					this.replayPerf.markCardsDbMs(Date.now() - cardsStart);
				})()
			: Promise.resolve();

		const [prebuiltIndex] = await Promise.all([indexPromise, cardsPromise]);

		const iterator: IterableIterator<[Game, number, string]> = this.createGamePipeline(
			replayAsString,
			start,
			options,
			config,
			prebuiltIndex,
		);
		return Observable.create(observer => {
			this.buildObservableFunction(observer, iterator);
		});
	}

	public cancelProcessing(): void {
		this.cancelled = true;
		clearTimeout(this.processingTimeout);
		this.activeIndex = null;
	}

	public getReplayIndex(): ReplayIndex | null {
		return this.activeIndex;
	}

	public ensureTurnParsed(game: Game, targetTurn: number): Game {
		if (!this.activeIndex || targetTurn < 0) {
			return game;
		}
		if (game.turns.has(targetTurn) && (game.turns.get(targetTurn)?.actions?.length ?? 0) > 0) {
			return game;
		}

		let parsedGame = game;
		const startChunk = this.turnCache.getLastProcessedChunk() + 1;
		for (let chunkIndex = startChunk; chunkIndex < this.activeIndex.turnChunks.length; chunkIndex++) {
			const history = this.activeIndex.turnChunks[chunkIndex];
			if (!history?.length) {
				continue;
			}
			parsedGame = this.processHistoryChunk(parsedGame, history, this.activeIndex, this.activeConfig, {
				deferStory: true,
			});
			if (parsedGame.turns.size > 0) {
				this.turnCache.markChunkProcessed(chunkIndex, parsedGame);
			}
			if (
				parsedGame.turns.has(targetTurn) &&
				(parsedGame.turns.get(targetTurn)?.actions?.length ?? 0) > 0
			) {
				break;
			}
		}
		return parsedGame;
	}

	private buildObservableFunction(observer, iterator: IterableIterator<[Game, number, string]>) {
		try {
			const itValue = iterator.next();
			if (!itValue.value) {
				if (itValue.done) {
					observer.next([null, DEFAULT_YIELD_MS, '']);
				}
				return;
			}
			const game: Game = itValue.value[0];
			if (itValue.done && game) {
				this.replayPerf.markTurnCount(game.turns?.size ?? 0);
				this.replayPerf.markFullParse();
			} else if (game?.turns?.size > 0) {
				this.replayPerf.markFirstTurn();
			}
			observer.next([itValue.value[0], itValue.value[2], itValue.done]);
			if (!itValue.done && !this.cancelled) {
				this.processingTimeout = setTimeout(
					() => this.buildObservableFunction(observer, iterator),
					itValue.value[1],
				);
			}
		} catch (e) {
			console.error('[game-parser] Exception in buildObservableFunction', e);
		}
	}

	private *createGamePipeline(
		replayAsString: string,
		start: number,
		options: TechnicalParsingOptions,
		config: ActionParserConfig,
		prebuiltIndex: ReplayIndex | null = null,
	): IterableIterator<[Game, number, string]> {
		const yieldMs = options?.shouldYield ?? DEFAULT_YIELD_MS;

		if (!replayAsString || replayAsString.length == 0) {
			return [null, yieldMs, 'Invalid XML replay'];
		}

		this.activeConfig = config;
		this.activeActionParsers = this.actionParser.createParsers(config);

		if (prebuiltIndex) {
			return yield* this.processIndexedReplay(replayAsString, prebuiltIndex, options, config, yieldMs);
		}

		return yield* this.processReplayWithStreamingIndex(replayAsString, options, config, yieldMs);
	}

	private *processIndexedReplay(
		replayAsString: string,
		index: ReplayIndex,
		options: TechnicalParsingOptions,
		config: ActionParserConfig,
		yieldMs: number,
	): IterableIterator<[Game, number, string]> {
		this.replayPerf.startEntityMapping();
		this.replayPerf.endEntityMapping();
		this.activeIndex = index;
		this.turnCache.reset(`${replayAsString.length}-${index.turnChunks.length}`);

		yield* this.processTurnChunks(index, options, config, yieldMs);
	}

	private *processReplayWithStreamingIndex(
		replayAsString: string,
		options: TechnicalParsingOptions,
		config: ActionParserConfig,
		yieldMs: number,
	): IterableIterator<[Game, number, string]> {
		this.replayPerf.startEntityMapping();
		const xmlParser = new XmlParserService();
		const turnChunks: HistoryItem[][] = [];
		let meta: ReplayIndexMeta | null = null;
		let game: Game = Game.createGame({} as Game);
		let counter = 0;
		const batchSize = options?.batchTurns ?? 1;
		let turnsSinceYield = 0;

		for (const chunk of xmlParser.parseXml(replayAsString)) {
			if (!chunk?.length) {
				continue;
			}
			meta = meta ?? extractMeta(chunk);
			turnChunks.push([...chunk]);
			const index = finalizeReplayIndex(turnChunks, meta, xmlParser.getEntityCardIdMap());
			this.activeIndex = index;
			this.turnCache.reset(`${replayAsString.length}-${index.turnChunks.length}`);

			if (index.meta && game.scenarioID == null) {
				game = Object.assign(game, index.meta as Game);
			}
			if (game.scenarioID === 3539) {
				this.replayPerf.endEntityMapping();
				return [null, yieldMs, 'Batllegrounds tutorial is not supported'];
			}

			const chunkIndex = turnChunks.length - 1;
			game = this.processHistoryChunk(game, chunk, index, config, options);
			if (game.turns.size > 0) {
				this.turnCache.markChunkProcessed(chunkIndex, game);
				turnsSinceYield++;
				if (turnsSinceYield >= batchSize) {
					turnsSinceYield = 0;
					yield [game, yieldMs, 'Parsed turn ' + counter++];
				}
			}
		}

		this.replayPerf.endEntityMapping();

		if (!this.activeIndex) {
			return [null, yieldMs, 'Invalid XML replay'];
		}

		if (turnsSinceYield > 0) {
			yield [game, yieldMs, 'Parsed turn ' + counter++];
		}
		if (options?.deferStory && game?.turns?.size > 0) {
			game = this.narrator.buildFullStory(game);
		} else if (options?.deferNarrator && game?.turns?.size > 0) {
			game = this.narrator.enrichAllActionText(game);
		}
		return [game, yieldMs, 'Rendering game state'];
	}

	private *processTurnChunks(
		index: ReplayIndex,
		options: TechnicalParsingOptions,
		config: ActionParserConfig,
		yieldMs: number,
	): IterableIterator<[Game, number, string]> {
		let game: Game = Game.createGame({} as Game);
		if (index.meta) {
			game = Object.assign(game, index.meta as Game);
		}
		if (game.scenarioID === 3539) {
			return [null, yieldMs, 'Batllegrounds tutorial is not supported'];
		}

		let counter = 0;
		const batchSize = options?.batchTurns ?? 1;
		let turnsSinceYield = 0;

		for (let chunkIndex = 0; chunkIndex < index.turnChunks.length; chunkIndex++) {
			const history = index.turnChunks[chunkIndex];
			if (!history?.length) {
				continue;
			}
			game = this.processHistoryChunk(game, history, index, config, options);
			if (game.turns.size > 0) {
				this.turnCache.markChunkProcessed(chunkIndex, game);
				turnsSinceYield++;
				if (turnsSinceYield >= batchSize) {
					turnsSinceYield = 0;
					yield [game, yieldMs, 'Parsed turn ' + counter++];
				}
			}
		}
		if (turnsSinceYield > 0) {
			yield [game, yieldMs, 'Parsed turn ' + counter++];
		}
		if (options?.deferStory && game?.turns?.size > 0) {
			game = this.narrator.buildFullStory(game);
		} else if (options?.deferNarrator && game?.turns?.size > 0) {
			game = this.narrator.enrichAllActionText(game);
		}
		return [game, yieldMs, 'Rendering game state'];
	}

	private processHistoryChunk(
		game: Game,
		history: readonly HistoryItem[],
		index: ReplayIndex,
		config: ActionParserConfig,
		options: TechnicalParsingOptions,
	): Game {
		const actionParsers = this.activeActionParsers ?? this.actionParser.createParsers(config);
		let entities = this.gamePopulationService.initNewEntities(game, history, index.entityCardId);
		if (game.turns.size === 0) {
			game = this.gameInitializer.initializePlayers(game, entities);
			game = this.gameStateParser.updateEntitiesUntilMulliganState(game, entities, history);
			entities = game.entitiesBeforeMulligan;
		}

		game = this.turnParser.createTurns(game, history);
		game = this.actionParser.parseActions(game, entities, history, config, false, actionParsers);
		if (game.turns.size === 0) {
			return game;
		}

		game = this.activePlayerParser.parseActivePlayerForLastTurn(game);
		game = this.activeSpellParser.parseActiveSpellForLastTurn(game);
		game = this.targetsParser.parseTargetsForLastTurn(game);
		if (game.turns.size === 1) {
			game = this.mulliganParser.affectMulligan(game);
		}
		game = this.endGameParser.parseEndGame(game);
		if (!options?.deferNarrator) {
			game = this.narrator.populateActionTextForLastTurn(game);
		}
		if (!options?.deferStory) {
			game = this.narrator.createGameStoryForLastTurn(game);
		}
		return game;
	}
}

export interface GameProcessingStep {
	game: Game;
	shouldBubble: boolean;
}

export interface TechnicalParsingOptions {
	readonly shouldYield?: number;
	readonly skipUi?: boolean;
	readonly deferNarrator?: boolean;
	readonly deferStory?: boolean;
	readonly batchTurns?: number;
	/** When set (e.g. from a Web Worker in the app), skips main-thread XML indexing. */
	readonly prebuiltIndex?: ReplayIndex;
	/** Resolve index off the main thread; awaited at parse start (can overlap with cards DB init). */
	readonly prebuiltIndexPromise?: Promise<ReplayIndex | null>;
}
