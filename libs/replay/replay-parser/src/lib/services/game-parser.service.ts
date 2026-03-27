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
import { StateProcessorService } from './state-processor.service';
import { XmlParserService } from './xml-parser.service';

const SMALL_PAUSE = 15;

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

		if (!this.allCards.getCards()?.length) {
			await this.allCards.initializeCardsDb();
			this.logPerf('Retrieved cards DB, parsing replay', start);
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
		// // console.log('calling next iteration');
		try {
			const itValue = iterator.next();
			// // console.log('calling next obersable', itValue, itValue.value);
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
		if (!replayAsString || replayAsString.length == 0) {
			return [null, SMALL_PAUSE, 'Invalid XML replay'];
		}

		// console.log('[game-parser] preparing entity / acrd ID mapping');
		let entityCardId: Map<number, string> = Map([]);
		const fullEntityIdCardIdMatcher = new RegExp(/id="(.*?)" cardID="(.*?)"/g);
		const fullEntityMatchResult = replayAsString.match(fullEntityIdCardIdMatcher);
		for (let match of fullEntityMatchResult) {
			const result = new RegExp(/id="(.*?)" cardID="(.*?)"/g).exec(match);
			if (result) {
				entityCardId = entityCardId.set(parseInt(result[1]), result[2]);
			}
		}
		const showEntityIdCardIdMatcher = new RegExp(/cardID="(.*?)" entity="(.*?)"/g);
		const showEntityMatchResult = replayAsString.match(showEntityIdCardIdMatcher);
		for (let match of showEntityMatchResult) {
			// // console.log("updating with show', result", copy);
			const result = new RegExp(/cardID="(.*?)" entity="(.*?)"/g).exec(match);
			if (result) {
				// // console.log('result', result);
				entityCardId = entityCardId.set(parseInt(result[2]), result[1]);
			}
		}
		// console.log('[game-parser] mapping done', entityCardId.size);

		// Do the parsing turn by turn
		// let history: readonly HistoryItem[];
		const xmlParsingIterator: IterableIterator<readonly HistoryItem[]> = new XmlParserService().parseXml(
			replayAsString,
		);
		let game: Game = Game.createGame({} as Game);
		let counter = 0;
		while (true) {
			const itValue = xmlParsingIterator.next();
			const history: readonly HistoryItem[] = itValue.value;
			// console.debug('[game-parser] parsing for', counter, 'with history length', history.length);

			if (!history || itValue.done) {
				// console.debug('[game-parser] history parsing over', itValue);
				break;
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
				return [null, SMALL_PAUSE, 'Batllegrounds tutorial is not supported'];
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
			game = this.actionParser.parseActions(game, entities, history, config);
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
				// // console.log('game after parseEndGame', game, game.turns.toJS());
				game = this.narrator.populateActionTextForLastTurn(game);
				// // console.log('game after populateActionText', game, game.turns.toJS());
				game = this.narrator.createGameStoryForLastTurn(game);
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

				yield [game, SMALL_PAUSE, 'Parsed turn ' + counter++];
			} else {
				// if (counter++ === 3) {
				// 	counter++;
				// 	// // console.log('returning', counter, game.entities.get(73), game.entities.get(74));
				// 	return [game, SMALL_PAUSE, 'Rendering game state'];
				// }
				// counter++;
			}
		}
		// console.log('parsing done, returning');
		return [game, SMALL_PAUSE, 'Rendering game state'];
	}

	private logPerf<T>(what: string, start: number, result?: T): T {
		// console.log('[perf] ', what, 'done after ', Date.now() - start, 'ms');
		return result;
	}
}

export interface GameProcessingStep {
	game: Game;
	shouldBubble: boolean;
}

export interface TechnicalParsingOptions {
	readonly shouldYield: number;
	readonly skipUi: boolean;
}
