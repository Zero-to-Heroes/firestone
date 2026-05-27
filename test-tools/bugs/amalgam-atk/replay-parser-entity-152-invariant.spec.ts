/**
 * Diagnostic invariant for the `amalgam-atk` bug: PTLState.GameState.CurrentEntities must
 * still contain entity 152 (Adaptive Amalgam, VAC_958) when the PowerTaskList stream
 * reaches its `TAG_CHANGE id=152 tag=ATK value=1` line at 20:58:07.
 *
 * ### Mechanism (confirmed by the checkpoints below on first red run)
 *
 * 1. At GS BLOCK_START `BlockType=PLAY Entity=Blessing of the Bronze id=116 cardId=END_000p`
 *    (fixture line ~12267), the rewind controller eagerly retains a snapshot because the
 *    oracle reports END_000p as REWIND-capable. The snapshot deep-clones BOTH GS and PTL
 *    ParserState at that moment.
 * 2. At that exact moment PTL has NOT yet processed entity 152's `FULL_ENTITY` (which
 *    arrives on PTL at fixture line ~12335) - the two streams interleave, and PTL lags
 *    behind GS for the same action. So the PTL half of the snapshot has 122 entities and
 *    no entity 152.
 * 3. GS GAME_RESET (line ~12620) restores GSState from snapshot, marks
 *    `pendingPtlRewindFlush=true`, parks the PTL half for the upcoming PTL GAME_RESET.
 * 4. PTL GAME_RESET (line ~14371) restores PTLState from the parked snapshot half.
 *    `PTLState.GameState.CurrentEntities` collapses from 129 (incl. 152) back to 122
 *    (no 152). Per the snapshot path, `insideGameResetPTL=true` makes
 *    `ReplayParser.ReadLine` skip every line inside the GAME_RESET block - including the
 *    authoritative `FULL_ENTITY id=152 zone=PLAY cardId=VAC_958` at fixture line ~15908,
 *    which would otherwise have re-introduced the entity.
 * 5. At line ~18599 the PTL stream emits `TAG_CHANGE id=152 tag=ATK`.
 *    `MinionOnBoardAttackUpdatedParser.AppliesOnNewNode` runs
 *    `CurrentEntities.get(152)!.GetTag(...)` -> `get()` returns undefined -> throw.
 *
 * The rewind-controller docstring acknowledges this slack ("the captured state has the
 * BLOCK_START line and any intervening TAG_CHANGE lines ... already applied. The
 * post-rewind GAME_RESET block re-emits authoritative FULL_ENTITY lines that overwrite
 * this small drift") - but the contract is currently broken because those authoritative
 * FULL_ENTITY lines never reach `FullEntityHandler` on the snapshot path.
 *
 * ### Why this spec lives in `test-tools/bugs/` and stays permanent
 *
 *   - The production parser `MinionOnBoardAttackUpdatedParser.AppliesOnNewNode` reads
 *     `this.GameState.CurrentEntities.get(entityId)!.GetTag(...)` and crashes with
 *     `Cannot read properties of undefined (reading 'GetTag')` when the entity is missing.
 *     That crash is intentional state-invariant signal - per user constraint we do NOT
 *     add a null guard there.
 *   - This spec is a low-level invariant guard at parser granularity. End-state behavior
 *     (turn advance, opponent hand, ...) is covered by the sibling
 *     `power-log-amalgam-atk-replay.spec.ts`.
 *   - Together they pin the bug from both ends: parser-internal invariant + user-visible
 *     end state. The spec stays after the fix so the desync cannot regress.
 *
 * Fixture is the trimmed lines 115091-133755 of the original power.log (5th game starting
 * at 20:52:38, REWIND from Blessing of the Bronze hero power at 20:57:00, deathrattle
 * shuffle of Adaptive Amalgam at 20:58:03, failing ATK tag change at 20:58:07).
 */
import * as fs from 'fs';
import { ReplayParser, buildRewindCardOracle } from '@firestone/power-log-parser';
import { GameEvent } from '@firestone/power-log-parser';
import {
	buildAllCardsServiceForReplay,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';

interface Checkpoint {
	readonly label: string;
	readonly lineIndex: number;
	readonly ptlHas152: boolean;
	readonly ptlHas64: boolean;
	readonly ptlSize: number;
	readonly gsHas152: boolean;
}

interface RewindEvent {
	readonly type: 'REWIND_STARTED' | 'REWIND_OVER';
	readonly lineIndex: number;
	/** Snapshot path emits with `Value: { originEntityId }`; legacy fallback path emits without Value. */
	readonly hasPayload: boolean;
}

const ENTITY_AMALGAM = 152;
const ENTITY_HERO_PLAYER = 64;

/** Matches the exact failing line at fixture-line 18599 (20:58:07): the PTL TAG_CHANGE for entity 152's ATK. */
const FAILING_ATK_LINE_RE =
	/PowerTaskList\.DebugPrintPower.*TAG_CHANGE Entity=\[entityName=Adaptive Amalgam id=152 .* tag=ATK /;

/**
 * Any PTL `FULL_ENTITY` or `SHOW_ENTITY` line that targets entity id=152.
 * The first hit is `FULL_ENTITY - Updating [entityName=UNKNOWN ENTITY [cardType=INVALID] id=152 ...]`
 * at fixture-line 12335 - note the NESTED bracket, so a naive `[^\]]*id=152` fails to match.
 */
const PTL_INTRODUCES_152_RE =
	/PowerTaskList\.DebugPrintPower.*(?:FULL_ENTITY - Updating|SHOW_ENTITY - Updating Entity=)\b[\s\S]*\bid=152\b/;

/** PTL BLOCK_START for the GAME_RESET fired by Blessing of the Bronze (entity 116). */
const PTL_GAME_RESET_START_RE =
	/PowerTaskList\.DebugPrintPower.*BLOCK_START BlockType=GAME_RESET Entity=\[entityName=Blessing of the Bronze id=116/;

/** GS BLOCK_START for the GAME_RESET (fires before the PTL one in stream order). */
const GS_GAME_RESET_START_RE =
	/GameState\.DebugPrintPower.*BLOCK_START BlockType=GAME_RESET Entity=\[entityName=Blessing of the Bronze id=116/;

/**
 * GS root-level BLOCK_START `BlockType=PLAY` for Blessing of the Bronze. The rewind
 * controller eagerly retains a snapshot here because the cardId is known and the oracle
 * says END_000p is REWIND-capable. This is the moment the PTL half of the snapshot is
 * captured - whatever PTL has registered up to here is the state we rewind to.
 */
const GS_REWIND_ROOT_BLOCK_START_RE =
	/GameState\.DebugPrintPower.*BLOCK_START BlockType=PLAY Entity=\[entityName=Blessing of the Bronze id=116 .* cardId=END_000p/;

describe('Power log replay → ReplayParser entity-map invariant (amalgam-atk)', () => {
	it(
		'PTL CurrentEntities keeps entity 152 from its FULL_ENTITY through the failing TAG_CHANGE',
		async () => {
			const logPath = resolvePowerLogPathForSlug('amalgam-atk');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			requirePowerLogFixtureExists(logPath);

			const allCards = await buildAllCardsServiceForReplay(cardsPath);
			if (allCards == null) {
				throw new Error(
					`[amalgam-atk] could not load cards_short.json from ${cardsPath}; ` +
						'set HS_REFERENCE_CARDS_JSON_PATH to a reachable file path or raw GitHub URL.',
				);
			}
			const oracle = buildRewindCardOracle(allCards);
			const parser = new ReplayParser(oracle);
			const rewindEvents: RewindEvent[] = [];
			let lineIndexForEvent = -1;
			parser.onGameEvent = (event: GameEvent) => {
				if (event.Type === 'REWIND_STARTED' || event.Type === 'REWIND_OVER') {
					rewindEvents.push({
						type: event.Type as RewindEvent['type'],
						lineIndex: lineIndexForEvent,
						hasPayload: event.Value != null,
					});
				}
			};

			const lines = fs.readFileSync(logPath, 'utf8').split(/\r?\n/);
			const checkpoints: Checkpoint[] = [];
			const ptlHas152Transitions: { lineIndex: number; from: boolean; to: boolean }[] = [];
			let prevPtlHas152 = false;
			let ptlGameResetDepth = 0;
			let sawPtlGameResetEnd = false;
			let sawGsGameResetStart = false;
			let sawPtlGameResetStart = false;
			let sawGsRewindRootBlockStart = false;
			let crashAtLineIndex: number | null = null;
			let crashError: unknown = null;
			let preCrashCheckpoint: Checkpoint | null = null;
			let postPtlGameResetCheckpoint: Checkpoint | null = null;
			let preGsGameResetCheckpoint: Checkpoint | null = null;
			let postGsGameResetStartCheckpoint: Checkpoint | null = null;
			let postPtlGameResetStartCheckpoint: Checkpoint | null = null;
			let atSnapshotCaptureCheckpoint: Checkpoint | null = null;

			const snapshot = (label: string, lineIndex: number): Checkpoint => {
				const ptl = parser.State.PTLState.GameState;
				const gs = parser.State.GSState.GameState;
				return {
					label,
					lineIndex,
					ptlHas152: ptl.CurrentEntities.has(ENTITY_AMALGAM),
					ptlHas64: ptl.CurrentEntities.has(ENTITY_HERO_PLAYER),
					ptlSize: ptl.CurrentEntities.size,
					gsHas152: gs.CurrentEntities.has(ENTITY_AMALGAM),
				};
			};

			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				if (!line || !line.length) continue;
				lineIndexForEvent = i;

				const isFailingAtkLine = FAILING_ATK_LINE_RE.test(line);
				if (isFailingAtkLine && preCrashCheckpoint == null) {
					// Snapshot BEFORE feeding the failing line so we see the state the parser is
					// about to read. The line itself does not mutate CurrentEntities, but the
					// check the production parser does (`get(152)!.GetTag(...)`) happens during
					// ReadLine processing; capturing here gives us the cleanest "what the
					// parser saw" diagnostic.
					preCrashCheckpoint = snapshot('pre-crash-failing-tag-change', i);
					checkpoints.push(preCrashCheckpoint);
				}

				// Snapshot the state at the exact moment the rewind controller's
				// `retainSnapshot` deep-clones it: the GS PLAY BLOCK_START for Blessing of the
				// Bronze (cardId=END_000p, which the oracle reports as REWIND-capable). What PTL
				// has registered before this line is the only state PTL can restore to later.
				const isGsRewindRootBlockStart = !sawGsRewindRootBlockStart && GS_REWIND_ROOT_BLOCK_START_RE.test(line);

				// Snapshot just before the GS GAME_RESET BLOCK_START is fed (i.e. the state the
				// rewind controller will *capture into the snapshot if it has one parked, or
				// restore from*).
				const isGsGameResetStart = !sawGsGameResetStart && GS_GAME_RESET_START_RE.test(line);
				if (isGsGameResetStart) {
					preGsGameResetCheckpoint = snapshot('pre-gs-game-reset-block-start', i);
					checkpoints.push(preGsGameResetCheckpoint);
					sawGsGameResetStart = true;
				}

				const isPtlGameResetStart = !sawPtlGameResetStart && PTL_GAME_RESET_START_RE.test(line);

				try {
					parser.ReadLine(line, 0, i);
				} catch (e) {
					crashAtLineIndex = i;
					crashError = e;
					break;
				}

				// Track every transition of `PTLState.GameState.CurrentEntities.has(152)`. The
				// raw FULL_ENTITY line does not commit to CurrentEntities immediately - the
				// commit lands on the next "boundary" line (next entity, block end, etc.) - so
				// using the FULL_ENTITY line as an assertion anchor is fragile. The transition
				// list captures the actual flips and lets us reason about ingest semantics
				// without coupling to commit timing.
				const ptlHas152Now = parser.State.PTLState.GameState.CurrentEntities.has(ENTITY_AMALGAM);
				if (ptlHas152Now !== prevPtlHas152) {
					ptlHas152Transitions.push({ lineIndex: i, from: prevPtlHas152, to: ptlHas152Now });
					prevPtlHas152 = ptlHas152Now;
				}
				// Touch the regex once per line so it is exercised - the line content alone is
				// not enough to tell us when registration *committed*, but having the regex run
				// keeps the spec self-documenting (we are aware the FULL_ENTITY-id-152 lines
				// exist; we just rely on the transition tracker to see when ingest takes effect).
				void PTL_INTRODUCES_152_RE.test(line);

				if (isGsRewindRootBlockStart) {
					sawGsRewindRootBlockStart = true;
					atSnapshotCaptureCheckpoint = snapshot('at-snapshot-capture-gs-rewind-root-block-start', i);
					checkpoints.push(atSnapshotCaptureCheckpoint);
				}

				if (isGsGameResetStart) {
					postGsGameResetStartCheckpoint = snapshot('after-gs-game-reset-block-start', i);
					checkpoints.push(postGsGameResetStartCheckpoint);
				}

				if (isPtlGameResetStart) {
					sawPtlGameResetStart = true;
					ptlGameResetDepth = 1;
					postPtlGameResetStartCheckpoint = snapshot('after-ptl-game-reset-block-start', i);
					checkpoints.push(postPtlGameResetStartCheckpoint);
				} else if (ptlGameResetDepth > 0 && /PowerTaskList\.DebugPrintPower/.test(line)) {
					if (/BLOCK_START/.test(line)) {
						ptlGameResetDepth++;
					} else if (/BLOCK_END/.test(line)) {
						ptlGameResetDepth--;
						if (ptlGameResetDepth === 0 && !sawPtlGameResetEnd) {
							sawPtlGameResetEnd = true;
							postPtlGameResetCheckpoint = snapshot('after-ptl-game-reset-block-end', i);
							checkpoints.push(postPtlGameResetCheckpoint);
						}
					}
				}
			}

			// Drain queued events so REWIND_STARTED / REWIND_OVER / TURN_START etc. flow through
			// the `onGameEvent` callback. In production the GameEvents service calls these after
			// every batch in `processLogsWithTsParser`; the diagnostic spec calls them once at
			// the end since per-line flushing would change emission ordering vs production.
			parser.State.GSState.NodeParser.ClearQueue();
			parser.State.PTLState.NodeParser.ClearQueue();

			const finalSnapshot = snapshot('end-of-replay', lines.length - 1);
			checkpoints.push(finalSnapshot);

			console.log(
				'[amalgam-atk diagnostic] checkpoints',
				JSON.stringify(
					checkpoints.map((c) => ({
						label: c.label,
						lineIndex: c.lineIndex,
						ptlHas152: c.ptlHas152,
						ptlHas64: c.ptlHas64,
						ptlSize: c.ptlSize,
						gsHas152: c.gsHas152,
					})),
					null,
					2,
				),
			);
			console.log(
				'[amalgam-atk diagnostic] PTL.CurrentEntities.has(152) transitions',
				JSON.stringify(ptlHas152Transitions, null, 2),
			);
			console.log(
				'[amalgam-atk diagnostic] rewind events',
				JSON.stringify(
					rewindEvents.map((e) => ({
						type: e.type,
						lineIndex: e.lineIndex,
						hasPayload: e.hasPayload,
						pathHint: e.type === 'REWIND_STARTED' ? (e.hasPayload ? 'snapshot' : 'legacy-fallback') : '—',
					})),
					null,
					2,
				),
			);
			if (crashAtLineIndex != null) {
				console.log('[amalgam-atk diagnostic] parser throw at line', crashAtLineIndex, lines[crashAtLineIndex]);
				console.log('[amalgam-atk diagnostic] throw =', (crashError as Error)?.message ?? crashError);
			}

			// --- INVARIANT 1 (ingest sanity) -------------------------------------------------
			// By the time the parser is about to feed GS GAME_RESET BLOCK_START, the PTL stream
			// has been processed up through entity 152's FULL_ENTITY + SHOW_ENTITY (and the
			// follow-up boundary lines that commit them). PTL must therefore contain 152. If
			// this fails, basic ingest is broken (would indicate something upstream of the
			// rewind machinery is wrong - very unlikely sanity guard).
			expect(preGsGameResetCheckpoint).not.toBeNull();
			expect(preGsGameResetCheckpoint!.ptlHas152).toBe(true);

			// --- INVARIANT 2 (the bug detector at restore) -----------------------------------
			// Right after the PTL GAME_RESET BLOCK_START fires (`onPtlGameResetStart` has
			// restored the parked snapshot half), entity 152 should still be in PTL
			// CurrentEntities. With the current bug, the snapshot was captured eagerly at the
			// rewind-root GS BLOCK_START (before PTL had processed 152's FULL_ENTITY), so the
			// restore wipes 152. After the fix this checkpoint must be `true` whether the
			// chosen fix is "snapshot capture timing" or "silently re-ingest GAME_RESET
			// FULL_ENTITY lines".
			expect(postPtlGameResetStartCheckpoint).not.toBeNull();
			expect(postPtlGameResetStartCheckpoint!.ptlHas152).toBe(true);

			// --- INVARIANT 3 (the bug detector at GAME_RESET block end) ----------------------
			// By the time the PTL GAME_RESET BLOCK_END is processed, the FULL_ENTITY re-dump
			// inside the block (line ~15908) should have re-registered entity 152 in PTL
			// CurrentEntities (either because the line was ingested silently, or because the
			// snapshot was correct in the first place).
			expect(postPtlGameResetCheckpoint).not.toBeNull();
			expect(postPtlGameResetCheckpoint!.ptlHas152).toBe(true);

			// --- INVARIANT 4 (the bug detector at the crash line) ----------------------------
			// At the moment the production parser reads `CurrentEntities.get(152)!.GetTag(...)`
			// it must be a hit. This is the direct cause of the
			// `MinionOnBoardAttackUpdatedParser` throw and the production log spam.
			expect(preCrashCheckpoint).not.toBeNull();
			expect(preCrashCheckpoint!.ptlHas152).toBe(true);

			// --- INVARIANT 5 (transition stability) ------------------------------------------
			// Once entity 152 enters PTL CurrentEntities, it must not be removed before the
			// failing TAG_CHANGE line. The TS Map semantics for entity removal are only
			// supposed to fire on `PartialReset` (game reset via legacy fallback) or new-game,
			// neither of which should happen between entity 152's registration and 20:58:07.
			// A false→true→false oscillation here pinpoints the offending step.
			const transitionsUpToCrash = ptlHas152Transitions.filter(
				(t) => t.lineIndex < (preCrashCheckpoint?.lineIndex ?? Number.MAX_SAFE_INTEGER),
			);
			expect(transitionsUpToCrash.length).toBeGreaterThanOrEqual(1);
			expect(transitionsUpToCrash[transitionsUpToCrash.length - 1].to).toBe(true);

			// Surface the throw in the test output so red-test failures are easy to read.
			// We don't *require* the absence of a throw here (the end-state spec is where the
			// observable-behavior assertion lives), but if all the invariants above pass and
			// the parser still throws, that would be its own diagnostic signal.
			if (crashAtLineIndex != null) {
				console.log(
					'[amalgam-atk diagnostic] parser threw - this is the symptom; the failing',
					'invariant above pinpoints the cause.',
				);
			}
		},
		120_000,
	);
});
