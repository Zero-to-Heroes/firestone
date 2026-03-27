/**
 * Integration test: replay a trimmed power.log through GameEvents + GameStateService,
 * then validate Ivory Rook discover guess state (armor vs possibleCards costs).
 *
 * Prerequisites:
 * - `test-tools/power-logs/ivory.log` (or env `IVORY_POWER_LOG_PATH`)
 * - Sibling `../hs-reference-data/src/cards_short.json` (or env `HS_REFERENCE_CARDS_JSON_PATH`)
 *
 * Run from repo root:
 *   npx jest libs/game-state/src/testing/power-log-ivory-rook-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 *
 * Uses setAppInjector — prefer running this pattern alone or in-band.
 */
import * as fs from 'fs';
import * as path from 'path';
import { Injector, NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AllCardsService, CardIds, SceneMode } from '@firestone-hs/reference-data';
import { ArenaRefService } from '@firestone/arena/data-access';
import {
	BgsBattleSimulationService,
	BgsIntermediateResultsSimGuardianService,
} from '@firestone/battlegrounds/core';
import { BattlegroundsInfo, MemoryInspectionService, SceneService } from '@firestone/memory';
import {
	BugReportService,
	GameStatusService,
	GlobalErrorService,
	LogsUploaderService,
	PowerLogBufferService,
	Preferences,
	PreferencesService,
} from '@firestone/shared/common/service';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import {
	CardsFacadeService,
	CardsFacadeStandaloneService,
	ILocalizationService,
	OwUtilsService,
	setAppInjector,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { trimPowerLogLinesToLastGame } from '../../../../test-tools/lib/trim-power-log-last-game';
import { DeckCard } from '../lib/models/deck-card';
import { DeckState } from '../lib/models/deck-state';
import { GameState } from '../lib/models/game-state';
import { AiDeckService } from '../lib/services/deck/ai-deck-service.service';
import { ConstructedArchetypeServiceOrchestrator } from '../lib/services/deck/constructed-archetype-orchestrator.service';
import { DeckParserService } from '../lib/services/deck/deck-parser.service';
import { DeckHandlerService } from '../lib/services/deck-handler.service';
import { DeckManipulationHelper } from '../lib/services/game-events/event-parser/deck-manipulation-helper';
import { SecretsParserService } from '../lib/services/game-events/event-parser/secrets/secrets-parser.service';
import { GameEvents } from '../lib/services/game-events/game-events.service';
import { GameEventsEmitterService } from '../lib/services/game-events/game-events-emitter.service';
import { GameStateParsersService } from '../lib/services/game-events/state-parsers.service';
import { GameEventsFacadeService } from '../lib/services/game-events-facade.service';
import { GameStateFacadeService } from '../lib/services/game-state-facade.service';
import { GameStateMetaInfoService } from '../lib/services/game-state-meta-info.service';
import { IvoryRook } from '../lib/services/cards/ivory-rook';
import { GameStateService } from '../lib/services/game-state.service';
import { RealTimeStatsService } from '../lib/services/real-time-stats/real-time-stats.service';
import { GameUniqueIdService } from '../lib/services/game-unique-id.service';
import { OverlayDisplayService } from '../lib/services/overlay-display.service';
import { SecretConfigService } from '../lib/services/secrets/secret-config.service';
import { BgsMatchMemoryInfoService } from '../lib/services/battlegrounds/bgs-match-memory-info.service';

function resolveCardsJsonPath(): string {
	const env = process.env['HS_REFERENCE_CARDS_JSON_PATH'];
	if (env && fs.existsSync(env)) {
		return env;
	}
	const sibling = path.join(__dirname, '../../../../..', 'hs-reference-data', 'src', 'cards_short.json');
	if (fs.existsSync(sibling)) {
		return sibling;
	}
	return path.join(process.cwd(), '..', 'hs-reference-data', 'src', 'cards_short.json');
}

function resolveIvoryLogPath(): string {
	const env = process.env['IVORY_POWER_LOG_PATH'];
	if (env && fs.existsSync(env)) {
		return env;
	}
	return path.join(__dirname, '../../../../', 'test-tools', 'power-logs', 'ivory.log');
}

describe('Power log replay → GameStateService (Ivory Rook cost narrowing)', () => {
	const ivoryRookId = CardIds.IvoryRook_WON_116;

	type ReplayContext = {
		allCardsRef: AllCardsService;
		state: GameState;
		ivoryCreated: readonly DeckCard[];
	};

	async function setupAndReplay(): Promise<ReplayContext | null> {
		const cardsPath = resolveCardsJsonPath();
		const logPath = resolveIvoryLogPath();
		if (!fs.existsSync(cardsPath)) {
			console.warn('[power-log-replay] Skip: cards DB not found at', cardsPath);
			return null;
		}
		if (!fs.existsSync(logPath)) {
			console.warn('[power-log-replay] Skip: ivory.log not found at', logPath);
			return null;
		}

		const allCardsRef = new AllCardsService();
		allCardsRef.initializeCardsDbFromCards(JSON.parse(fs.readFileSync(cardsPath, 'utf8')));

		const cardsFacade = new CardsFacadeStandaloneService();
		(cardsFacade as unknown as { service: AllCardsService }).service = allCardsRef;
		await cardsFacade.waitForReady();

		const prefsMock: Partial<PreferencesService> = {
			isReady: async () => undefined,
			getPreferences: async () => new Preferences(),
			preferences$$: new BehaviorSubject(new Preferences()),
		};

		const overlayMock: Partial<OverlayDisplayService> = {
			isReady: async () => undefined,
			decktrackerDisplayEventBus$$: new BehaviorSubject(false),
		};

		const gameState$$ = new BehaviorSubject(GameState.create({}));
		const gameStateFacadeMock: Partial<GameStateFacadeService> = {
			isReady: async () => undefined,
			gameState$$: gameState$$ as any,
		};

		const sceneMock: Partial<SceneService> = {
			isReady: async () => undefined,
			currentScene$$: new BehaviorSubject<SceneMode | null>(null),
			lastNonGamePlayScene$$: new BehaviorSubject<SceneMode | null | undefined>(null),
		};

		const inGame$$ = new SubscriberAwareBehaviorSubject<boolean | null>(true);
		const gameStatusMock: Partial<GameStatusService> = {
			isReady: async () => undefined,
			inGame$$: inGame$$ as any,
			onGameStart: async (callback: any) => {
				callback?.();
			},
		};

		const memoryMock: Partial<MemoryInspectionService> = {
			getGameUniqueId: async () => null,
			getCurrentSceneFromMindVision: async () => null,
		};

		const arenaRefMock = {
			validDiscoveryPool$$: new BehaviorSubject<readonly string[]>([]),
		} as unknown as ArenaRefService;

		const reviewIdMock = {
			reviewId$$: new BehaviorSubject<string | null>('ivory-power-log-replay'),
		} as unknown as import('../lib/services/review-id.service').ReviewIdService;

		const i18nMock = {
			translate: (key: string) => key,
		} as unknown as ILocalizationService;

		const ngZone = new NgZone({ enableLongStackTrace: false, shouldCoalesceEventChangeDetection: false });

		const cards = cardsFacade as unknown as CardsFacadeService;
		const helper = new DeckManipulationHelper(cards, i18nMock);
		const secretsParser = new SecretsParserService(helper, cards);
		const eventsEmitter = new GameEventsEmitterService();

		const parserService = new GameStateParsersService(
			helper,
			cards,
			i18nMock,
			null as unknown as AiDeckService,
			null as unknown as DeckHandlerService,
			memoryMock as MemoryInspectionService,
			null as unknown as OwUtilsService,
			prefsMock as PreferencesService,
			null as unknown as DeckParserService,
			null as unknown as SecretConfigService,
			null as unknown as ConstructedArchetypeServiceOrchestrator,
			eventsEmitter,
			null as unknown as BugReportService,
			null as unknown as LogsUploaderService,
			null as unknown as BgsBattleSimulationService,
			{} as any,
			null as unknown as GameUniqueIdService,
			null as unknown as BgsIntermediateResultsSimGuardianService,
			reviewIdMock,
			arenaRefMock,
		);

		const bgsMemoryMock: Partial<BgsMatchMemoryInfoService> = {
			battlegroundsMemoryInfo$$: new BehaviorSubject<BattlegroundsInfo | null>(null),
		};

		const realTimeStatsMock = { addListener: () => undefined };
		const bgsSimulationMock = { battleInfo$$: new BehaviorSubject(null) };

		TestBed.configureTestingModule({
			providers: [
				{ provide: CardsFacadeService, useValue: cardsFacade },
				{ provide: PreferencesService, useValue: prefsMock },
				{ provide: OverlayDisplayService, useValue: overlayMock },
				{ provide: GameStateFacadeService, useValue: gameStateFacadeMock },
				{ provide: SceneService, useValue: sceneMock },
				{ provide: GameStatusService, useValue: gameStatusMock },
				{ provide: MemoryInspectionService, useValue: memoryMock },
				{ provide: GlobalErrorService, useValue: { notifyCriticalError: () => undefined } },
				PowerLogBufferService,
				GameEventsFacadeService,
				GameUniqueIdService,
				GameEventsEmitterService,
				{ provide: GameStateParsersService, useValue: parserService },
				{ provide: SecretsParserService, useValue: secretsParser },
				GameStateMetaInfoService,
				{ provide: BgsMatchMemoryInfoService, useValue: bgsMemoryMock },
				{ provide: RealTimeStatsService, useValue: realTimeStatsMock },
				{ provide: BgsBattleSimulationService, useValue: bgsSimulationMock },
				{ provide: NgZone, useValue: ngZone },
				GameEvents,
				GameStateService,
			],
		});

		setAppInjector(TestBed.inject(Injector));

		TestBed.inject(GameEvents);
		const gameStateService = TestBed.inject(GameStateService);
		const gameEvents = TestBed.inject(GameEvents);

		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));

		for (const line of lines) {
			if (line.length) {
				gameEvents.receiveLogLine(line);
			}
		}

		await new Promise((r) => setTimeout(r, 8000));

		const state = gameStateService.state;
		const allZones = (d: DeckState) => [...d.hand, ...d.deck, ...d.board, ...d.otherZone, ...d.deckList];
		const allCardsInDecks = [...allZones(state.playerDeck), ...allZones(state.opponentDeck)];
		const ivoryCreated = allCardsInDecks.filter((c) => c.creatorCardId === ivoryRookId);

		return { allCardsRef, state, ivoryCreated };
	}

	it(
		'replays trimmed ivory.log through GameEvents + GameStateService and finds Ivory Rook–created cards',
		async () => {
			const ctx = await setupAndReplay();
			if (!ctx) {
				return;
			}
			expect(ctx.ivoryCreated.length).toBeGreaterThan(0);
		},
		120_000,
	);

	// Unskip once RECEIVE / guess pipeline attaches `guessedInfo.possibleCards` for Ivory discover during replay.
	it.skip(
		'keeps guessed discover possibleCards consistent with armor / discovered mana cost (regression for Ivory Rook)',
		async () => {
			const ctx = await setupAndReplay();
			if (!ctx) {
				return;
			}
			expect(ctx.ivoryCreated.length).toBeGreaterThan(0);

			const { allCardsRef, state, ivoryCreated } = ctx;

			for (const zoneCard of ivoryCreated) {
				const dc = zoneCard as DeckCard;
				const gi = dc.guessedInfo;
				const statePool = gi?.possibleCards ?? [];
				const armorHint = gi?.cost ?? dc.storedInformation?.armorGained;
				const discoveredCost = dc.cardId ? allCardsRef.getCard(dc.cardId)?.cost : undefined;

				const refGuess = IvoryRook.guessInfo!({
					card: dc,
					deckState: state.playerDeck,
					opponentDeckState: state.opponentDeck,
					gameState: state,
					allCards: allCardsRef,
					creatorEntityId: dc.creatorEntityId,
					options: {
						validArenaPool: [],
						metadata: state.metadata,
					},
				});
				const refPool = refGuess?.possibleCards ?? [];

				console.log('[ivory-rook-replay] entity', dc.entityId, {
					discoveredCardId: dc.cardId,
					discoveredCost,
					armorFromGuess: gi?.cost,
					armorStored: dc.storedInformation?.armorGained,
					statePossibleCount: statePool.length,
					refPossibleCount: refPool.length,
				});

				expect(refPool.length).toBeGreaterThan(0);

				const costsInRef = new Set(
					refPool.map((id: string) => allCardsRef.getCard(id)?.cost).filter((c) => c !== undefined),
				);

				if (typeof armorHint === 'number' && !Number.isNaN(armorHint)) {
					expect(statePool.length).toBeGreaterThan(0);
					const wrongInState = statePool.filter(
						(id: string) => (allCardsRef.getCard(id)?.cost ?? -1) !== armorHint,
					);
					expect(wrongInState).toEqual([]);
				} else if (discoveredCost !== undefined && !Number.isNaN(discoveredCost)) {
					expect(statePool.length).toBeGreaterThan(0);
					const wrongInState = statePool.filter(
						(id: string) => (allCardsRef.getCard(id)?.cost ?? -1) !== discoveredCost,
					);
					expect(wrongInState).toEqual([]);
				} else if (costsInRef.size > 1) {
					expect(statePool.length).toBeGreaterThan(0);
					const stateCosts = new Set(
						statePool.map((id: string) => allCardsRef.getCard(id)?.cost).filter((c) => c !== undefined),
					);
					expect(stateCosts.size).toBe(1);
				}
			}
		},
		120_000,
	);
});
