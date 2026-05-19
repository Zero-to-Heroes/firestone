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
	) {}
	private cancelled: boolean;
	private processingTimeout;

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

		if (!this.allCards.getCards()?.length) {
			const cardsStart = Date.now();
			await this.allCards.initializeCardsDb();
			this.replayPerf.markCardsDbMs(Date.now() - cardsStart);
		}

		const iterator: IterableIterator<[Game, number, string]> = this.createGamePipeline(
			replayAsString,
			start,
			options,
			config,
		);
		return Observable.create(observer => {
			this.buildObservableFunction(observer, iterator);
		});
	}

	public cancelProcessing(): void {
		this.cancelled = true;
		clearTimeout(this.processingTimeout);
	}

	private buildObservableFunction(observer, iterator: IterableIterator<[Game, number, string]>) {
		try {
			const itValue = iterator.next();
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
	): IterableIterator<[Game, number, string]> {
		const yieldMs = options?.shouldYield ?? DEFAULT_YIELD_MS;

		if (!replayAsString || replayAsString.length == 0) {
			return [null, yieldMs, 'Invalid XML replay'];
		}

		this.replayPerf.startEntityMapping();

		const xmlParser = new XmlParserService();
		const xmlParsingIterator: IterableIterator<readonly HistoryItem[]> = xmlParser.parseXml(replayAsString);
		let entityCardId: Map<number, string> = Map([]);
		let game: Game = Game.createGame({} as Game);
		let counter = 0;
		const actionParsers = this.actionParser.createParsers(config);
		while (true) {
			const itValue = xmlParsingIterator.next();
			const history: readonly HistoryItem[] = itValue.value;

			if (!history || itValue.done) {
				entityCardId = xmlParser.getEntityCardIdMap();
				this.replayPerf.endEntityMapping();
				break;
			}

			if (entityCardId.size === 0) {
				entityCardId = xmlParser.getEntityCardIdMap();
			} else if (counter === 0) {
				this.replayPerf.endEntityMapping();
			}

			if (history[0] instanceof GameHistoryItem) {
				const gameHistory: GameHistoryItem = history[0] as GameHistoryItem;
				game = Object.assign(game, {
					buildNumber: gameHistory.buildNumber,
					formatType: gameHistory.formatType,
					gameType: gameHistory.gameType,
					scenarioID: gameHistory.scenarioID,
				} as Game);
				// console.log('[game-parser] assign meta data to game', game);
			}

			// Battlegrounds tutorial
			if (game.scenarioID === 3539) {
				// console.log('[game-parser] Battlegrounds tutorial not supported, returning');
				return [null, yieldMs, 'Batllegrounds tutorial is not supported'];
			}

			// Preload the images we'll need early on
			// const preloadIterator = this.imagePreloader.preloadImages(history);
			// while (true) {
			// 	const itValue = preloadIterator.next();
			// 	if (itValue.done) {
			// 		break;
			// 	}
			// }

			// console.log('[game-parser] will initNewEntities', game, history, entityCardId.toJS());
			let entities = this.gamePopulationService.initNewEntities(game, history, entityCardId);
			// console.log('[game-parser] initNewEntities', entities.size);
			if (game.turns.size === 0) {
				game = this.gameInitializer.initializePlayers(game, entities);
				game = this.gameStateParser.updateEntitiesUntilMulliganState(game, entities, history);
				entities = game.entitiesBeforeMulligan;
				// // console.log('game after populateEntitiesUntilMulliganState', game, game.turns.toJS());
			}

			game = this.turnParser.createTurns(game, history);
			// // console.log('game after turn creation', game.turns.size);
			game = this.actionParser.parseActions(game, entities, history, config, false, actionParsers);
			// // console.log(
			// 	'entity 150 parseActions',
			// 	game.getLatestParsedState().get(150) &&
			// 		game
			// 			.getLatestParsedState()
			// 			.get(150)
			// 			.tags.toJS(),
			// );
			// // console.log('game after action pasring', game.getLatestParsedState().toJS());
			if (game.turns.size > 0) {
				game = this.activePlayerParser.parseActivePlayerForLastTurn(game);
				// // console.log(
				// 	'entity 150 parseActivePlayerForLastTurn',
				// 	game.getLatestParsedState().get(150) &&
				// 		game
				// 			.getLatestParsedState()
				// 			.get(150)
				// 			.tags.toJS(),
				// );
				// // console.log('game after parseActivePlayer', game, game.turns.toJS());
				game = this.activeSpellParser.parseActiveSpellForLastTurn(game);
				// // console.log(
				// 	'entity 150 parseActiveSpellForLastTurn',
				// 	game.getLatestParsedState().get(150) &&
				// 		game
				// 			.getLatestParsedState()
				// 			.get(150)
				// 			.tags.toJS(),
				// );
				// // console.log('game after parseActiveSpell', game, game.turns.toJS());
				game = this.targetsParser.parseTargetsForLastTurn(game);
				// // console.log(
				// 	'entity 150 parseTargetsForLastTurn',
				// 	game.getLatestParsedState().get(150) &&
				// 		game
				// 			.getLatestParsedState()
				// 			.get(150)
				// 			.tags.toJS(),
				// );
				// // console.log('game after parseTargets', game, game.turns.toJS());
				if (game.turns.size === 1) {
					game = this.mulliganParser.affectMulligan(game);
				}
				// // console.log('game after affectMulligan', game, game.turns.toJS());
				game = this.endGameParser.parseEndGame(game);
				if (!options?.deferNarrator) {
					game = this.narrator.populateActionTextForLastTurn(game);
				}
				if (!options?.deferStory) {
					game = this.narrator.createGameStoryForLastTurn(game);
				}
				// // console.log(
				// 	'entity 150 createGameStoryForLastTurn',
				// 	game.getLatestParsedState().get(150) &&
				// 		game
				// 			.getLatestParsedState()
				// 			.get(150)
				// 			.tags.toJS(),
				// );
				// // console.log('game after createGameStory', game, game.turns.toJS());
				// if (counter === 4) {
				// 	counter++;
				// 	// console.log('returning', counter);
				// 	return [game, SMALL_PAUSE, 'Rendering game state'];
				// }
				// counter++;
				// // console.log('moving on', counter);
				// if (game.turns.size === 33) {
				// 	// console.log(
				// 		'entities at end of turn',
				// 		game.getLatestParsedState().toJS(),
				// 		game.getLatestParsedState().get(507),
				// 	);
				// }

				yield [game, yieldMs, 'Parsed turn ' + counter++];
			} else {
				// if (counter++ === 3) {
				// 	counter++;
				// 	// // console.log('returning', counter, game.entities.get(73), game.entities.get(74));
				// 	return [game, SMALL_PAUSE, 'Rendering game state'];
				// }
				// counter++;
			}
		}
		if (options?.deferStory && game?.turns?.size > 0) {
			game = this.narrator.buildFullStory(game);
		} else if (options?.deferNarrator && game?.turns?.size > 0) {
			game = this.narrator.enrichAllActionText(game);
		}
		return [game, yieldMs, 'Rendering game state'];
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
}
