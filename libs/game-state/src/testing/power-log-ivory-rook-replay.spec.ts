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

/**
 * Armor gained from Ivory Rook equals the discovered Taunt minion's mana cost.
 * Parse it from power.log: after Ivory Rook's armor SUB_SPELL, read hero ARMOR vs last ARMOR before that block.
 *
 * Matches lines like:
 * `TAG_CHANGE Entity=[entityName=Garrosh Hellscream id=64 ... cardId=HERO_01 player=1] tag=ARMOR value=7`
 */
const HERO_ARMOR_LINE_RE =
	/TAG_CHANGE Entity=\[[^\]]*cardId=HERO_01 player=1\][^\n]*\btag=ARMOR value=(\d+)/;

function extractHeroEntityIdFromSubSpellTargets(lines: readonly string[], subSpellLineIndex: number): number | null {
	for (let i = subSpellLineIndex + 1; i < Math.min(subSpellLineIndex + 12, lines.length); i++) {
		const m = lines[i].match(/Targets\[0\] = \[entityName=[^\]]*?\bid=(\d+)\b/);
		if (m) {
			return parseInt(m[1], 10);
		}
	}
	return null;
}

function lastHeroArmorBeforeLine(lines: readonly string[], heroEntityId: number, beforeIndex: number): number {
	const re = new RegExp(
		`TAG_CHANGE Entity=\\[[^\\]]*\\bid=${heroEntityId}\\b[^\\]]*\\]\\s*tag=ARMOR value=(\\d+)`,
	);
	let last = 0;
	for (let i = 0; i < beforeIndex; i++) {
		const m = lines[i].match(re);
		if (m) {
			last = parseInt(m[1], 10);
		}
	}
	return last;
}

function firstHeroArmorAtOrAfterLine(lines: readonly string[], heroEntityId: number, fromIndex: number): number | null {
	const re = new RegExp(
		`TAG_CHANGE Entity=\\[[^\\]]*\\bid=${heroEntityId}\\b[^\\]]*\\]\\s*tag=ARMOR value=(\\d+)`,
	);
	for (let i = fromIndex; i < lines.length; i++) {
		const m = lines[i].match(re);
		if (m) {
			return parseInt(m[1], 10);
		}
	}
	return null;
}

/**
 * @returns Mana cost of the discovered minion (= armor gained), or null if the fixture block is missing.
 */
function extractIvoryRookDiscoverArmorGainFromPowerLogLines(lines: readonly string[]): number | null {
	let subIdx = -1;
	for (let i = 0; i < lines.length; i++) {
		if (!lines[i].includes('SUB_SPELL_START')) {
			continue;
		}
		const window = lines.slice(i, Math.min(i + 6, lines.length)).join('\n');
		if (window.includes('Ivory Rook') && window.includes('WON_116')) {
			subIdx = i;
			break;
		}
	}
	if (subIdx < 0) {
		return null;
	}
	let heroId = extractHeroEntityIdFromSubSpellTargets(lines, subIdx);
	let prevArmor: number;
	let newArmor: number | null;
	if (heroId != null) {
		prevArmor = lastHeroArmorBeforeLine(lines, heroId, subIdx);
		newArmor = firstHeroArmorAtOrAfterLine(lines, heroId, subIdx);
	} else {
		prevArmor = 0;
		for (let i = 0; i < subIdx; i++) {
			const m = lines[i].match(HERO_ARMOR_LINE_RE);
			if (m) {
				prevArmor = parseInt(m[1], 10);
			}
		}
		newArmor = null;
		for (let i = subIdx; i < Math.min(subIdx + 25, lines.length); i++) {
			const m = lines[i].match(HERO_ARMOR_LINE_RE);
			if (m) {
				newArmor = parseInt(m[1], 10);
				break;
			}
		}
	}
	if (newArmor == null) {
		return null;
	}
	return newArmor - prevArmor;
}
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

	it('parses armor gained from ivory.log (equals discovered minion cost)', () => {
		const logPath = resolveIvoryLogPath();
		if (!fs.existsSync(logPath)) {
			return;
		}
		const raw = fs.readFileSync(logPath, 'utf8');
		const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		const gain = extractIvoryRookDiscoverArmorGainFromPowerLogLines(logLines);
		expect(gain).toBe(7);
	});

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
		'replays ivory.log, parses armor gained from the log, and expects discover possibleCards to match that mana cost',
		async () => {
			const logPath = resolveIvoryLogPath();
			const cardsPath = resolveCardsJsonPath();
			if (!fs.existsSync(cardsPath) || !fs.existsSync(logPath)) {
				return;
			}
			const raw = fs.readFileSync(logPath, 'utf8');
			const logLines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
			const expectedDiscoverCost = extractIvoryRookDiscoverArmorGainFromPowerLogLines(logLines);
			expect(expectedDiscoverCost).toBe(7);

			const ctx = await setupAndReplay();
			if (!ctx) {
				return;
			}
			expect(ctx.ivoryCreated.length).toBeGreaterThan(0);

			const { allCardsRef, ivoryCreated } = ctx;
			for (const zoneCard of ivoryCreated) {
				const dc = zoneCard as DeckCard;
				const pool = dc.guessedInfo?.possibleCards ?? [];
				if (pool.length === 0) {
					throw new Error(
						`Ivory Rook discover (entity ${dc.entityId}): guessedInfo.possibleCards is empty after replay; cannot verify all options are ${expectedDiscoverCost}-cost taunts (armor gained from power.log).`,
					);
				}
				const wrongCosts = pool.filter(
					(cardId: string) => (allCardsRef.getCard(cardId)?.cost ?? -1) !== expectedDiscoverCost,
				);
				expect(wrongCosts).toEqual([]);
			}
		},
		120_000,
	);
});
