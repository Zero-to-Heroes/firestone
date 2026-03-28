/**
 * Shared setup for integration tests that replay a power.log through GameEvents + GameStateService.
 *
 * Fixtures live under `test-tools/bugs/<bug-id>/` (see {@link resolvePowerLogPathForSlug}).
 */
import * as fs from 'fs';
import * as path from 'path';
import { Injector, NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AllCardsService, SceneMode } from '@firestone-hs/reference-data';
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
	resetAppInjectorForTesting,
	setAppInjector,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import {
	AiDeckService,
	BgsMatchMemoryInfoService,
	ConstructedArchetypeServiceOrchestrator,
	DeckCard,
	DeckHandlerService,
	DeckManipulationHelper,
	DeckParserService,
	DeckState,
	GameEvents,
	GameEventsEmitterService,
	GameEventsFacadeService,
	GameState,
	GameStateFacadeService,
	GameStateMetaInfoService,
	GameStateParsersService,
	GameStateService,
	GameUniqueIdService,
	OverlayDisplayService,
	RealTimeStatsService,
	ReviewIdService,
	SecretConfigService,
	SecretsParserService,
} from '@firestone/game-state';
import { trimPowerLogLinesToLastGame } from './trim-power-log-last-game';

/** Env override per slug, e.g. `IVORY_POWER_LOG_PATH`, `TORCH_POWER_LOG_PATH`. */
const LEGACY_ENV_BY_SLUG: Record<string, string> = {
	ivory: 'IVORY_POWER_LOG_PATH',
	torch: 'TORCH_POWER_LOG_PATH',
};

/**
 * Relative path under `test-tools/bugs/` for known investigations.
 * New bugs: add a folder `test-tools/bugs/<id>/` with `<id>.log` (or map here) and pass the matching slug.
 */
const DEFAULT_BUG_LOG_BY_SLUG: Record<string, string> = {
	ivory: 'ivory-rook/ivory.log',
	torch: 'torch/torch.log',
};

export function resolveCardsJsonPath(): string {
	const env = process.env['HS_REFERENCE_CARDS_JSON_PATH'];
	if (env && fs.existsSync(env)) {
		return env;
	}
	const sibling = path.join(__dirname, '..', '..', 'hs-reference-data', 'src', 'cards_short.json');
	if (fs.existsSync(sibling)) {
		return sibling;
	}
	return path.join(process.cwd(), '..', 'hs-reference-data', 'src', 'cards_short.json');
}

/**
 * Path to the trimmed power.log for a bug investigation.
 * Default: `test-tools/bugs/<mapped path>` — see {@link DEFAULT_BUG_LOG_BY_SLUG}, or `<slug>/<slug>.log` for new slugs.
 * Override: {@link LEGACY_ENV_BY_SLUG}, or `POWER_LOG_<SLUG>_PATH`.
 */
export function resolvePowerLogPathForSlug(slug: string): string {
	const legacy = LEGACY_ENV_BY_SLUG[slug];
	if (legacy) {
		const p = process.env[legacy];
		if (p && fs.existsSync(p)) {
			return p;
		}
	}
	const generic = process.env[`POWER_LOG_${slug.toUpperCase()}_PATH`];
	if (generic && fs.existsSync(generic)) {
		return generic;
	}
	const rel = DEFAULT_BUG_LOG_BY_SLUG[slug] ?? `${slug}/${slug}.log`;
	return path.join(__dirname, '..', 'bugs', rel);
}

export function collectAllDeckCards(state: GameState): DeckCard[] {
	const allZones = (d: DeckState) => [...d.hand, ...d.deck, ...d.board, ...d.otherZone, ...d.deckList];
	return [...allZones(state.playerDeck), ...allZones(state.opponentDeck)];
}

export type PowerLogReplayResult = {
	readonly allCardsRef: AllCardsService;
	readonly state: GameState;
	readonly gameStateService: GameStateService;
};

export type ReplayPowerLogOptions = {
	logPath: string;
	/** Passed to ReviewIdService mock (game-start parser). */
	reviewId?: string;
	/** Wait after last line so async parsers finish (default 8000). */
	settleMs?: number;
};

/**
 * Build TestBed, replay trimmed log lines, return final game state.
 * Call from a single test file or reset TestBed between uses.
 */
export async function replayPowerLogToGameState(
	options: ReplayPowerLogOptions,
): Promise<PowerLogReplayResult | null> {
	const { logPath, reviewId = 'power-log-replay', settleMs = 8000 } = options;

	const cardsPath = resolveCardsJsonPath();
	if (!fs.existsSync(cardsPath)) {
		console.warn('[power-log-replay] Skip: cards DB not found at', cardsPath);
		return null;
	}
	if (!fs.existsSync(logPath)) {
		console.warn('[power-log-replay] Skip: log not found at', logPath);
		return null;
	}

	TestBed.resetTestingModule();
	resetAppInjectorForTesting();

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
		reviewId$$: new BehaviorSubject<string | null>(reviewId),
	} as unknown as ReviewIdService;

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

	await new Promise((r) => setTimeout(r, settleMs));

	return {
		allCardsRef,
		state: gameStateService.state,
		gameStateService,
	};
}
