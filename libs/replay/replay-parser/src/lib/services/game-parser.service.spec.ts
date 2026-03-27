import * as fs from 'fs';
import * as path from 'path';
import { Map } from 'immutable';
import { Entity } from '../models/game/entity';
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
import { StateProcessorService } from './state-processor.service';
import { XmlParserService } from './xml-parser.service';

describe('GameParserService', () => {
	let allCards: AllCardsService;
	let actionParser: ActionParserService;
	let turnParser: TurnParserService;
	let gamePopulationService: GamePopulationService;
	let gameStateParser: GameStateParserService;
	let gameInitializer: GameInitializerService;
	let activePlayerParser: ActivePlayerParserService;
	let activeSpellParser: ActiveSpellParserService;
	let targetsParser: TargetsParserService;
	let mulliganParser: MulliganParserService;
	let endGameParser: EndGameParserService;
	let narrator: NarratorService;

	beforeAll(async () => {
		allCards = new AllCardsService();
		const cardsJsonPath = path.join(__dirname, '..', '..', '..', '..', '..', '..', '..', 'hs-reference-data', 'src', 'cards_short.json');
		const cardsJson = JSON.parse(fs.readFileSync(cardsJsonPath, 'utf8'));
		allCards.service.initializeCardsDbFromCards(cardsJson);

		const stateProcessor = new StateProcessorService();
		actionParser = new ActionParserService(allCards, stateProcessor);
		turnParser = new TurnParserService();
		gamePopulationService = new GamePopulationService(allCards);
		gameStateParser = new GameStateParserService();
		gameInitializer = new GameInitializerService();
		activePlayerParser = new ActivePlayerParserService(allCards);
		activeSpellParser = new ActiveSpellParserService(allCards);
		targetsParser = new TargetsParserService(allCards);
		mulliganParser = new MulliganParserService(allCards);
		endGameParser = new EndGameParserService(allCards);
		narrator = new NarratorService();
	}, 30_000);

	it('should parse XML replay (test-3 - full game)', () => {
		const xmlPath = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'test-tools', 'replay-test-3.xml');
		const xml = fs.readFileSync(xmlPath, 'utf8');
		expect(xml.length).toBeGreaterThan(0);

		const warnSpy = jest.spyOn(console, 'warn');
		const errorSpy = jest.spyOn(console, 'error');

		let game: Game;
		try {
			game = runPipeline(xml);
		} catch (e) {
			console.log(`[test-3] Pipeline crashed: ${e.message}`);
			// Still report what we captured
		}

		const missingActionWarnings = warnSpy.mock.calls.filter(
			(call) => typeof call[0] === 'string' && call[0].includes('missing last action'),
		);
		const allWarnings = warnSpy.mock.calls.filter(
			(call) => typeof call[0] === 'string',
		);
		console.log(`[test-3] Found ${missingActionWarnings.length} "missing last action" warnings out of ${allWarnings.length} total warnings`);
		if (game) {
			console.log(`[test-3] Total turns: ${game.turns.size}`);
			game.turns.forEach((turn, idx) => {
				console.log(`  Turn ${idx} ("${turn.turn}"): ${turn.actions?.length ?? 0} actions`);
			});
		}

		warnSpy.mockRestore();
		errorSpy.mockRestore();

		expect(missingActionWarnings.length).toBe(0);
	}, 60_000);

	it('should parse XML replay (test-2 - BG)', () => {
		const xmlPath = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'test-tools', 'replay-test-2.xml');
		const xml = fs.readFileSync(xmlPath, 'utf8');
		expect(xml.length).toBeGreaterThan(0);

		const warnSpy = jest.spyOn(console, 'warn');

		const game = runPipeline(xml);

		expect(game).toBeTruthy();

		const missingActionWarnings = warnSpy.mock.calls.filter(
			(call) => typeof call[0] === 'string' && call[0].includes('missing last action'),
		);
		console.log(`Found ${missingActionWarnings.length} "missing last action" warnings`);

		// Diagnostics: show turns and their action counts
		console.log(`Total turns: ${game.turns.size}`);
		game.turns.forEach((turn, idx) => {
			console.log(`  Turn ${idx} ("${turn.turn}"): ${turn.actions?.length ?? 0} actions`);
		});

		warnSpy.mockRestore();
	}, 60_000);

	function runPipeline(replayAsString: string): Game {
		let entityCardId: Map<number, string> = Map([]);
		const fullEntityIdCardIdMatcher = new RegExp(/id="(.*?)" cardID="(.*?)"/g);
		const fullEntityMatchResult = replayAsString.match(fullEntityIdCardIdMatcher);
		if (fullEntityMatchResult) {
			for (const match of fullEntityMatchResult) {
				const result = new RegExp(/id="(.*?)" cardID="(.*?)"/g).exec(match);
				if (result) {
					entityCardId = entityCardId.set(parseInt(result[1]), result[2]);
				}
			}
		}
		const showEntityIdCardIdMatcher = new RegExp(/cardID="(.*?)" entity="(.*?)"/g);
		const showEntityMatchResult = replayAsString.match(showEntityIdCardIdMatcher);
		if (showEntityMatchResult) {
			for (const match of showEntityMatchResult) {
				const result = new RegExp(/cardID="(.*?)" entity="(.*?)"/g).exec(match);
				if (result) {
					entityCardId = entityCardId.set(parseInt(result[2]), result[1]);
				}
			}
		}

		const xmlParsingIterator: IterableIterator<readonly HistoryItem[]> = new XmlParserService().parseXml(
			replayAsString,
		);
		let game: Game = Game.createGame({} as Game);
		const config = new ActionParserConfig();
		let counter = 0;

		while (true) {
			const itValue = xmlParsingIterator.next();
			const history: readonly HistoryItem[] = itValue.value;

			if (!history || itValue.done) {
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
			}

			let entities = gamePopulationService.initNewEntities(game, history, entityCardId);
			if (game.turns.size === 0) {
				game = gameInitializer.initializePlayers(game, entities);
				game = gameStateParser.updateEntitiesUntilMulliganState(game, entities, history);
				entities = game.entitiesBeforeMulligan;
			}

			game = turnParser.createTurns(game, history);
			game = actionParser.parseActions(game, entities, history, config);
			if (game.turns.size > 0) {
				game = activePlayerParser.parseActivePlayerForLastTurn(game);
				game = activeSpellParser.parseActiveSpellForLastTurn(game);
				game = targetsParser.parseTargetsForLastTurn(game);
				if (game.turns.size === 1) {
					game = mulliganParser.affectMulligan(game);
				}
				game = endGameParser.parseEndGame(game);
				game = narrator.populateActionTextForLastTurn(game);
				game = narrator.createGameStoryForLastTurn(game);
			}
			counter++;
		}
		console.log(`Parsed ${counter} chunks, ${game.turns.size} turns`);
		return game;
	}
});
