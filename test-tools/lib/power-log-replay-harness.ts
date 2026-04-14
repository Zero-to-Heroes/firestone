/**
 * Shared setup for integration tests that replay a power.log through GameEvents + GameStateService.
 *
 * Fixtures live under `test-tools/bugs/<bug-id>/` (see {@link resolvePowerLogPathForSlug}).
 */
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
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
	ApiRunner,
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
import { trimPowerLogLinesToLastGame } from '@firestone/power-log-parser';

/** Wait until GameEvents' log line queue is empty (large replays enqueue faster than the 500ms batch). */
async function waitForGameEventsQueueDrain(gameEvents: GameEvents, maxWaitMs: number): Promise<void> {
	const queue = (
		gameEvents as unknown as { processingQueue?: { eventsPendingCount(): number } }
	).processingQueue;
	if (!queue?.eventsPendingCount) {
		return;
	}
	const start = Date.now();
	while (queue.eventsPendingCount() > 0 && Date.now() - start < maxWaitMs) {
		await new Promise((r) => setTimeout(r, 25));
	}
}

/** Raw JSON for `cards_short.json` (use with `HS_REFERENCE_CARDS_JSON_PATH` or fetch in tooling). */
export const HS_REFERENCE_CARDS_SHORT_RAW_URL =
	'https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json';

/** True if `ref` is an http(s) URL to load, or an existing local file path. */
export function isCardsJsonRefAvailable(ref: string): boolean {
	return /^https?:\/\//i.test(ref.trim()) || fs.existsSync(ref);
}

/**
 * Turn a GitHub "blob" browser URL into a raw.githubusercontent.com URL so `fetch` receives JSON.
 * Leaves ordinary `https://` URLs unchanged.
 */
export function normalizeCardsJsonRefForFetch(ref: string): string {
	const t = ref.trim();
	const m = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+?)(?:\?[^#]*)?(?:#.*)?$/i.exec(t);
	if (m) {
		const [, owner, repo, branch, filePath] = m;
		return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
	}
	return t;
}

let cachedRemoteCardsJson: { readonly url: string; readonly text: string } | null = null;

/** When `fetch` is missing (e.g. some Jest/Node setups), load JSON over HTTP(S) with Node builtins. */
function loadHttpUrlTextWithNode(url: string): Promise<string | null> {
	const lib = url.startsWith('https') ? https : http;
	return new Promise((resolve) => {
		const req = lib.get(url, (res) => {
			const status = res.statusCode ?? 0;
			if (status >= 400) {
				console.warn('[power-log-replay] cards HTTP', status, url);
				res.resume();
				resolve(null);
				return;
			}
			const chunks: Buffer[] = [];
			res.on('data', (c: Buffer) => chunks.push(c));
			res.on('end', () => {
				resolve(Buffer.concat(chunks).toString('utf8'));
			});
		});
		req.on('error', (e) => {
			console.warn('[power-log-replay] cards HTTP get failed', url, e);
			resolve(null);
		});
		req.setTimeout(60_000, () => {
			req.destroy();
			console.warn('[power-log-replay] cards HTTP get timeout', url);
			resolve(null);
		});
	});
}

async function loadHttpUrlText(url: string): Promise<string | null> {
	if (typeof fetch === 'function') {
		try {
			const res = await fetch(url);
			if (!res.ok) {
				console.warn('[power-log-replay] cards HTTP', res.status, url);
				return null;
			}
			return await res.text();
		} catch (e) {
			console.warn('[power-log-replay] cards fetch failed', url, e);
			return null;
		}
	}
	return loadHttpUrlTextWithNode(url);
}

async function loadHttpUrlJson<T>(url: string): Promise<T | null> {
	const text = await loadHttpUrlText(url);
	if (text == null) {
		return null;
	}
	try {
		return JSON.parse(text) as T;
	} catch (e) {
		console.warn('[power-log-replay] JSON parse failed', url, e);
		return null;
	}
}

async function loadCardsShortJsonText(ref: string): Promise<string | null> {
	const fetchable = normalizeCardsJsonRefForFetch(ref);
	if (/^https?:\/\//i.test(fetchable)) {
		if (cachedRemoteCardsJson?.url === fetchable) {
			return cachedRemoteCardsJson.text;
		}
		const text = await loadHttpUrlText(fetchable);
		if (text != null) {
			cachedRemoteCardsJson = { url: fetchable, text };
		}
		return text;
	}
	try {
		return fs.readFileSync(fetchable, 'utf8');
	} catch (e) {
		console.warn('[power-log-replay] cards read failed', fetchable, e);
		return null;
	}
}

/** Env override per slug, e.g. `IVORY_POWER_LOG_PATH`, `TORCH_POWER_LOG_PATH`. */
const LEGACY_ENV_BY_SLUG: Record<string, string> = {
	'attack-counter-zero': 'POWER_LOG_ATTACK_COUNTER_ZERO_PATH',
	'libram-divinity': 'POWER_LOG_LIBRAM_DIVINITY_PATH',
	ivory: 'IVORY_POWER_LOG_PATH',
	torch: 'TORCH_POWER_LOG_PATH',
	'fabled-package': 'FABLED_PACKAGE_POWER_LOG_PATH',
	ysondre: 'YSONDRE_POWER_LOG_PATH',
	'body-wrapper': 'BODY_WRAPPER_POWER_LOG_PATH',
	'lady-liadrin': 'POWER_LOG_LADY_LIADRIN_PATH',
	'wings-of-hate': 'POWER_LOG_WINGS_OF_HATE_PATH',
	'malevolent-mutant': 'POWER_LOG_MALEVOLENT_MUTANT_PATH',
};

/**
 * Relative path under `test-tools/bugs/` for known investigations.
 * New bugs: add a folder `test-tools/bugs/<id>/` with `<id>.log` (or map here) and pass the matching slug.
 */
const DEFAULT_BUG_LOG_BY_SLUG: Record<string, string> = {
	ivory: 'ivory-rook/ivory.log',
	torch: 'torch/torch.log',
	remornia: 'remornia-weapon/remornia-weapon.log',
	'shatter-recombine': 'shatter-recombine/shatter-recombine.log',
	'mistah-vistah': 'mistah-vistah/mistah-vistah.log',
	'interstellar-wayfarer': 'interstellar-wayfarer/interstellar-wayfarer.log',
	'spark-life-shatter': 'spark-life-shatter/spark-life-shatter.log',
	'sands-time-shatter': 'sands-time-shatter/sands-time-shatter.log',
	azalina: 'azalina/azalina.log',
	'soldier-onyxia': 'soldier-onyxia/soldier-onyxia.log',
	'macaw-huntress': 'macaw-huntress/macaw-huntress.log',
	'passive-buff-unknown-entity':
		'passive-buff-unknown-entity/passive-buff-unknown-entity.log',
	'coin-not-revealed': 'coin-not-revealed/coin-not-revealed.log',
	'opponent-hand-single-guess': 'opponent-hand-single-guess/opponent-hand-single-guess.log',
	'gemstone-hoarder': 'gemstone-hoarder/gemstone-hoarder.log',
	'fabled-package': 'fabled-package-not-updated/fabled-package.log',
	ysondre: 'ysondre/ysondre.log',
	'secret-passage-draw-counter': 'secret-passage-draw-counter/secret-passage-draw-counter.log',
	'kaelthas-spell-cycle': 'kaelthas-spell-cycle/kaelthas.log',
	'body-wrapper': 'body-wrapper/body-wrapper.log',
	'frostbite-current-effects': 'frostbite-current-effects/frostbite-current-effects.log',
	'oh-my-yogg-secret': 'oh-my-yogg-secret/oh-my-yogg-secret.log',
	'attack-counter-zero': 'attack-counter-zero/attack-counter-zero.log',
	'libram-divinity': 'libram-divinity/libram-divinity.log',
	'enthrall-pool': 'enthrall-pool/enthrall-pool.log',
	'dh-hand-size': 'dh-hand-size/dh-hand-size.log',
	'lady-liadrin': 'lady-liadrin/lady-liadrin.log',
	'wings-of-hate': 'wings-of-hate/wings-of-hate.log',
	hivemap: 'hive-map-whelp/hive-map-whelp.log',
	'malevolent-mutant': 'malevolent-mutant/malevolent-mutant.log',
	'flight-maneuvers-gift': 'flight-maneuvers-gift/flight-maneuvers-gift.log',
	'local-player-name': 'local-player-name/local-player-name.log',
	'kiljaeden-portal': 'kiljaeden-portal/kiljaeden-portal.log',
	'dredge-info-leak': 'dredge-info-leak/dredge-info-leak.log',
	'cultist-map': 'cultist-map/cultist-map.log',
	meadowstrider: 'meadowstrider/meadowstrider.log',
	'shatter-reveal': 'shatter-reveal/shatter-reveal.log',
};

/**
 * Resolved reference to `cards_short.json`: local path and/or https URL.
 * Set `HS_REFERENCE_CARDS_JSON_PATH` to a filesystem path, a `raw.githubusercontent.com` URL, or a
 * GitHub `blob` URL (e.g. cards in browser) — the harness normalizes blob links for fetching.
 * See {@link HS_REFERENCE_CARDS_SHORT_RAW_URL}.
 */
export function resolveCardsJsonPath(): string {
	const env = process.env['HS_REFERENCE_CARDS_JSON_PATH']?.trim();
	if (env?.length) {
		if (/^https?:\/\//i.test(env)) {
			return normalizeCardsJsonRefForFetch(env);
		}
		if (fs.existsSync(env)) {
			return env;
		}
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
	readonly secretConfigService: SecretConfigService;
};

export type ReplayPowerLogOptions = {
	logPath: string;
	/** Passed to ReviewIdService mock (game-start parser). */
	reviewId?: string;
	/** Wait after last line so async parsers finish (default 8000). */
	settleMs?: number;
};

/**
 * Fail fast if the power.log fixture is missing (do not silently skip tests).
 */
export function requirePowerLogFixtureExists(logPath: string): void {
	if (!fs.existsSync(logPath)) {
		throw new Error(
			`[power-log-replay] Power log fixture missing: ${logPath}. Commit the log under test-tools/bugs/ or set the slug's POWER_LOG_* env override.`,
		);
	}
}

/**
 * Fail fast if `cards_short.json` cannot be resolved before replay.
 * CI should set `HS_REFERENCE_CARDS_JSON_PATH` or clone `hs-reference-data` next to the repo.
 * See {@link resolveCardsJsonPath} and {@link HS_REFERENCE_CARDS_SHORT_RAW_URL}.
 */
export function requireCardsJsonResolvableForReplay(cardsPath: string): void {
	if (!isCardsJsonRefAvailable(cardsPath)) {
		throw new Error(
			`[power-log-replay] cards_short.json not resolvable at: ${cardsPath}. ` +
				`Set HS_REFERENCE_CARDS_JSON_PATH to an existing file path or to ${HS_REFERENCE_CARDS_SHORT_RAW_URL}.`,
		);
	}
}

/**
 * Call after {@link replayPowerLogToGameState}. Fails if replay returned null (cards load failed, etc.).
 */
export function requirePowerLogReplayResult(
	ctx: PowerLogReplayResult | null,
	cardsPath: string,
): asserts ctx is PowerLogReplayResult {
	if (!ctx) {
		throw new Error(
			`[power-log-replay] replayPowerLogToGameState returned null — could not load cards from ${cardsPath}. ` +
				`If the path is an HTTPS URL, ensure fetch works and the network allows GitHub raw. ` +
				`Otherwise set HS_REFERENCE_CARDS_JSON_PATH to a local cards_short.json file.`,
		);
	}
}

/** Convenience: fixture log exists + cards path is resolvable (URL or existing file). */
export function requirePowerLogReplayPrerequisites(cardsPath: string, logPath: string): void {
	requireCardsJsonResolvableForReplay(cardsPath);
	requirePowerLogFixtureExists(logPath);
}

/**
 * Build TestBed, replay trimmed log lines, return final game state.
 * Call from a single test file or reset TestBed between uses.
 */
export async function replayPowerLogToGameState(
	options: ReplayPowerLogOptions,
): Promise<PowerLogReplayResult | null> {
	const { logPath, reviewId = 'power-log-replay', settleMs = 8000 } = options;

	const cardsRef = resolveCardsJsonPath();
	if (!isCardsJsonRefAvailable(cardsRef)) {
		console.warn('[power-log-replay] Skip: cards DB not found / unreachable at', cardsRef);
		return null;
	}
	if (!fs.existsSync(logPath)) {
		console.warn('[power-log-replay] Skip: log not found at', logPath);
		return null;
	}

	TestBed.resetTestingModule();
	resetAppInjectorForTesting();

	const cardsText = await loadCardsShortJsonText(cardsRef);
	if (cardsText == null) {
		console.warn('[power-log-replay] Skip: could not load cards JSON from', cardsRef);
		return null;
	}

	const allCardsRef = new AllCardsService();
	allCardsRef.initializeCardsDbFromCards(JSON.parse(cardsText));

	const cardsFacade = new CardsFacadeStandaloneService();
	(cardsFacade as unknown as { service: AllCardsService }).service = allCardsRef;
	await cardsFacade.waitForReady();

	const replayPreferences = Object.assign(new Preferences(), {
		flashWindowOnYourTurn: false,
		showNotificationOnYourTurn: false,
		opponentLoadAiDecklist: false,
		opponentLoadKnownDecklist: false,
	} as Partial<Preferences>);

	const prefsMock: Partial<PreferencesService> = {
		isReady: async () => undefined,
		getPreferences: async () => replayPreferences,
		preferences$$: new BehaviorSubject(replayPreferences),
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
		getCurrentBoard: async () => null,
	};

	const arenaRefMock = {
		validDiscoveryPool$$: {
			getValueWithInit: async () => [] as readonly string[],
			value: [] as readonly string[],
		},
	} as unknown as ArenaRefService;

	const reviewIdMock = {
		reviewId$$: new BehaviorSubject<string | null>(reviewId),
	} as unknown as ReviewIdService;

	const i18nMock = {
		translate: (key: string) => key,
		getCreatedByCardName: (cardName: string) => cardName,
	} as unknown as ILocalizationService;

	const ngZone = new NgZone({ enableLongStackTrace: false, shouldCoalesceEventChangeDetection: false });

	const cards = cardsFacade as unknown as CardsFacadeService;
	const helper = new DeckManipulationHelper(cards, i18nMock);
	const deckHandler = new DeckHandlerService(cards);
	const secretsParser = new SecretsParserService(helper, cards);
	const eventsEmitter = new GameEventsEmitterService();

	const deckParserReplayMock = {
		getOpenDecklist: async () => null as string | null,
		getTemplateDeck: async () => null,
		retrieveCurrentDeck: async () => null,
	} as unknown as DeckParserService;

	const aiDeckReplayMock = {
		getAiDeck: async () => null,
	} as unknown as AiDeckService;

	const owUtilsReplayMock = {
		flashWindow: () => undefined,
		showWindowsNotification: () => undefined,
	} as unknown as OwUtilsService;

	const apiRunnerReplayMock = {
		callGetApi: async <T>(url: string) => loadHttpUrlJson<T>(url),
	} as unknown as ApiRunner;
	const secretConfigService = new SecretConfigService(apiRunnerReplayMock, cards);

	const parserService = new GameStateParsersService(
		helper,
		cards,
		i18nMock,
		aiDeckReplayMock,
		deckHandler,
		memoryMock as MemoryInspectionService,
		owUtilsReplayMock,
		prefsMock as PreferencesService,
		deckParserReplayMock,
		secretConfigService,
		{ triggerArchetypeCategorization: () => undefined } as unknown as ConstructedArchetypeServiceOrchestrator,
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

	await waitForGameEventsQueueDrain(gameEvents, 600_000);
	await new Promise((r) => setTimeout(r, settleMs));

	return {
		allCardsRef,
		state: gameStateService.state,
		gameStateService,
		secretConfigService,
	};
}
