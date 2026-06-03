import * as fs from 'fs';
import * as path from 'path';
import { ChoiceType } from '@firestone-hs/reference-data';
import { Map } from 'immutable';
/**
 * Regression: review 9389796e — Blessing of the Moon (EDR_449p) discover options in Coliseum.
 * Fixture: replay.xml (this directory).
 */
import { DiscoverAction } from '../../../libs/replay/replay-parser/src/lib/models/action/discover-action';
import { Game } from '../../../libs/replay/replay-parser/src/lib/models/game/game';
import { ChoicesHistoryItem } from '../../../libs/replay/replay-parser/src/lib/models/history/choices-history-item';
import { HistoryItem } from '../../../libs/replay/replay-parser/src/lib/models/history/history-item';
import { ActionParserConfig, GameHistoryItem } from '../../../libs/replay/replay-parser/src/lib/models/models';
import { AllCardsService } from '../../../libs/replay/replay-parser/src/lib/services/all-cards.service';
import { GamePopulationService } from '../../../libs/replay/replay-parser/src/lib/services/entitiespipeline/game-population.service';
import { GameStateParserService } from '../../../libs/replay/replay-parser/src/lib/services/entitiespipeline/game-state-parser.service';
import { ActionParserService } from '../../../libs/replay/replay-parser/src/lib/services/gamepipeline/action-parser.service';
import { ActivePlayerParserService } from '../../../libs/replay/replay-parser/src/lib/services/gamepipeline/active-player-parser.service';
import { ActiveSpellParserService } from '../../../libs/replay/replay-parser/src/lib/services/gamepipeline/active-spell-parser.service';
import { EndGameParserService } from '../../../libs/replay/replay-parser/src/lib/services/gamepipeline/end-game-parser.service';
import { GameInitializerService } from '../../../libs/replay/replay-parser/src/lib/services/gamepipeline/game-initializer.service';
import { MulliganParserService } from '../../../libs/replay/replay-parser/src/lib/services/gamepipeline/mulligan-parser.service';
import { NarratorService } from '../../../libs/replay/replay-parser/src/lib/services/gamepipeline/narrator.service';
import { TargetsParserService } from '../../../libs/replay/replay-parser/src/lib/services/gamepipeline/targets-parser.service';
import { TurnParserService } from '../../../libs/replay/replay-parser/src/lib/services/gamepipeline/turn-parser.service';
import { StateProcessorService } from '../../../libs/replay/replay-parser/src/lib/services/state-processor.service';
import { XmlParserService } from '../../../libs/replay/replay-parser/src/lib/services/xml-parser.service';

const BLESSING_OF_THE_MOON_ENTITY_ID = 85;
const FIXTURE_PATH = path.join(__dirname, 'replay.xml');

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
	for (const match of replayAsString.matchAll(/id="(\d+)" cardID="([^"]+)"/g)) {
		entityCardId = entityCardId.set(parseInt(match[1], 10), match[2]);
	}
	for (const match of replayAsString.matchAll(/cardID="([^"]+)" entity="(\d+)"/g)) {
		entityCardId = entityCardId.set(parseInt(match[2], 10), match[1]);
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

function findBlessingDiscoverOnTurn(game: Game, turnKey: number): DiscoverAction | undefined {
	const turn = game.turns.get(turnKey);
	if (!turn?.actions?.length) {
		return undefined;
	}
	return turn.actions.find(
		(a): a is DiscoverAction => a instanceof DiscoverAction && a.originId === BLESSING_OF_THE_MOON_ENTITY_ID,
	);
}

describe('Blessing of the Moon discover replay (9389796e)', () => {
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

	it('parses ChoicesHistoryItem for Blessing with choice entity ids', () => {
		const xml = fs.readFileSync(FIXTURE_PATH, 'utf8');
		let blessingChoices: readonly number[] | undefined;
		for (const chunk of new XmlParserService().parseXml(xml)) {
			for (const item of chunk) {
				if (
					item instanceof ChoicesHistoryItem &&
					item.choices.source === BLESSING_OF_THE_MOON_ENTITY_ID &&
					item.choices.type === ChoiceType.GENERAL
				) {
					blessingChoices = item.choices.cards;
				}
			}
		}
		expect(blessingChoices?.length).toBeGreaterThan(0);
	});

	it('exposes Blessing discover on turn 20 with cardIDs on choice entities', () => {
		const xml = fs.readFileSync(FIXTURE_PATH, 'utf8');

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

		const turnKey = 20;
		const discover = findBlessingDiscoverOnTurn(game, turnKey);
		expect(discover).toBeDefined();
		expect(discover!.choices).toEqual([175, 176]);
		expect(discover!.chosen).toEqual([175]);

		for (const entityId of discover!.choices) {
			expect(discover!.entities.has(entityId)).toBe(true);
			expect(discover!.entities.get(entityId)?.cardID).toBeTruthy();
		}

		const discoverIdx = game.turns.get(turnKey)!.actions.indexOf(discover!);
		expect(discoverIdx).toBeGreaterThanOrEqual(0);
		expect(discoverIdx).toBe(7);
	}, 120_000);
});
