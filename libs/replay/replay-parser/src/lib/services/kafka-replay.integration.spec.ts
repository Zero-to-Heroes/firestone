import * as fs from 'fs';
import * as path from 'path';
import { GameTag, Zone } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
/**
 * Regression: replay c6b77b1c-3d09-4e73-841f-863fa970d901 (Lisq vs KAFKA).
 * Fixture: test-tools/bugs/kafka-replay/replay.xml (from Firestone replay CDN). The support power.zip for this report was empty.
 */
import { CardPlayedFromHandAction } from '../models/action/card-played-from-hand-action';
import { StartTurnAction } from '../models/action/start-turn-action';
import { Game } from '../models/game/game';
import { Turn } from '../models/game/turn';
import { HistoryItem } from '../models/history/history-item';
import { ShowEntityHistoryItem } from '../models/history/show-entity-history-item';
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

/** Full pipeline (same as game-parser.service.spec) for Kafka replay regression. */
function runPipeline(
	replayAsString: string,
	services: {
		gamePopulationService: GamePopulationService;
		gameStateParser: GameStateParserService;
		gameInitializer: GameInitializerService;
		turnParser: TurnParserService;
		actionParser: ActionParserService;
		activePlayerParser: ActivePlayerParserService;
		activeSpellParser: ActiveSpellParserService;
		targetsParser: TargetsParserService;
		mulliganParser: MulliganParserService;
		endGameParser: EndGameParserService;
		narrator: NarratorService;
	},
): Game {
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

	const {
		gamePopulationService,
		gameStateParser,
		gameInitializer,
		turnParser,
		actionParser,
		activePlayerParser,
		activeSpellParser,
		targetsParser,
		mulliganParser,
		endGameParser,
		narrator,
	} = services;

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
	}
	return game;
}

describe('Kafka replay (c6b77b1c) — Lisq vs KAFKA', () => {
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
		const cardsJsonPath = path.join(
			__dirname,
			'..',
			'..',
			'..',
			'..',
			'..',
			'..',
			'..',
			'hs-reference-data',
			'src',
			'cards_short.json',
		);
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
	}, 60_000);

	it('parses replay.xml with every non-mulligan turn having at least one action', () => {
		const xmlPath = path.join(
			__dirname,
			'..',
			'..',
			'..',
			'..',
			'..',
			'..',
			'test-tools',
			'bugs',
			'kafka-replay',
			'replay.xml',
		);
		const xml = fs.readFileSync(xmlPath, 'utf8');
		expect(xml.length).toBeGreaterThan(1000);

		let showEntityTlc255Count = 0;
		for (const chunk of new XmlParserService().parseXml(xml)) {
			for (const h of chunk) {
				if (
					h instanceof ShowEntityHistoryItem &&
					h.entityDefintion.id === 113 &&
					h.entityDefintion.cardID === 'TLC_255'
				) {
					showEntityTlc255Count++;
				}
			}
		}
		expect(showEntityTlc255Count).toBe(1);

		const game = runPipeline(xml, {
			gamePopulationService,
			gameStateParser,
			gameInitializer,
			turnParser,
			actionParser,
			activePlayerParser,
			activeSpellParser,
			targetsParser,
			mulliganParser,
			endGameParser,
			narrator,
		});

		const emptyTurns: number[] = [];
		game.turns.forEach((turn, turnNumber) => {
			if (turnNumber > 0 && (!turn.actions || turn.actions.length === 0)) {
				emptyTurns.push(turnNumber);
			}
		});

		expect(emptyTurns).toEqual([]);

		const lisq = game.players[0];
		const kafka = game.players[1];
		const startTurn = (turn: Turn | undefined) =>
			turn?.actions?.find((a) => a instanceof StartTurnAction) as StartTurnAction | undefined;

		// Coin: second player is Lisq — her first main phase is turn index 2 (0=mulligan, 1=KAFKA).
		expect(startTurn(game.turns.get(2))?.activePlayer).toBe(lisq.playerId);
		expect(startTurn(game.turns.get(1))?.activePlayer).toBe(kafka.playerId);

		const lisqTurnNumbers: number[] = [];
		game.turns.forEach((turn, turnNumber) => {
			if (turnNumber === 0) {
				return;
			}
			if (startTurn(turn)?.activePlayer === lisq.playerId) {
				lisqTurnNumbers.push(turnNumber);
			}
		});
		expect(lisqTurnNumbers.length).toBeGreaterThanOrEqual(4);
		expect(lisqTurnNumbers[3]).toBeDefined();

		// Crystal Tender (TLC_255): exactly one CardPlayedFromHand from ShowEntity under PLAY block,
		// with entity snapshot after reveal (ZONE PLAY) — not duplicated from Block.showEntities with a hand snapshot.
		const crystalTenderPlays: CardPlayedFromHandAction[] = [];
		game.turns.forEach((turn) => {
			for (const a of turn.actions ?? []) {
				if (
					a instanceof CardPlayedFromHandAction &&
					a.entityId === 113 &&
					a.entities?.get(113)?.cardID === 'TLC_255'
				) {
					crystalTenderPlays.push(a);
				}
			}
		});
		expect(crystalTenderPlays.length).toBe(1);
		expect(crystalTenderPlays[0].entities!.get(113)!.getTag(GameTag.ZONE)).toBe(Zone.PLAY);
	}, 120_000);
});
