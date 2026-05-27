/**
 * Parser-side rewind controller.
 *
 * Owns the snapshot/restore lifecycle around root-level BLOCK_STARTs, with one fully
 * independent snapshot pipeline per log stream (GS and PTL):
 *  - Each stream observes its own root-level BLOCK_START / SHOW_ENTITY / BLOCK_END /
 *    GAME_RESET events, consults the same {@link RewindCardOracle}, and captures /
 *    restores its own `ParserState` half against its own LIFO stack.
 *  - The two halves are NEVER cloned at the same wall-clock moment. They're each cloned
 *    at the moment their own stream first reaches "action about to start", so neither
 *    half is captured while its stream is still lagging behind the other (the eager-path
 *    bug for `END_000p` / Adaptive Amalgam was exactly this: cloning PTL at GS BLOCK_START
 *    captured a stale PTL state missing entities the still-in-flight Flashback PTL block
 *    would register seconds later).
 *  - Capture mode per BLOCK_START on a given stream:
 *      - cardId known + REWIND-capable -> deep-clone now, push to that stream's stack.
 *      - cardId known + non-REWIND     -> nothing.
 *      - cardId unknown (PLAY only)    -> stash meta only (O(1)); decide at SHOW_ENTITY.
 *  - On SHOW_ENTITY for an entity with a deferred pending meta on the same stream, the
 *    oracle reveals REWIND-capability and either deep-clones now or drops the meta.
 *
 *    The deferred capture is the central perf optimisation: opponents play 10-30 cards
 *    per match, essentially zero of which are REWIND-capable, so eagerly cloning on every
 *    opponent PLAY would burn dominant cost just to throw it away. Each stream pays the
 *    clone cost only on confirmed REWIND-capable cards.
 *  - Restore is symmetric: GS GAME_RESET BLOCK_START pops from `gsRetained` and restores
 *    `GSState`; PTL GAME_RESET BLOCK_START pops from `ptlRetained` and restores `PTLState`.
 *    There is no cross-stream parking - each stream owns its own restore artefact.
 *  - The `onRewindCapableActionStart` consumer hook fires from GS-side captures only.
 *    Because PTL trails GS for the same action, GS is always the first capture per
 *    rewind, so this is "fire exactly once per rewind-capable action" - the symmetric PTL
 *    capture is intentionally silent on the hook to avoid duplicate consumer snapshots.
 *
 * The controller is a plain class owned by {@link ReplayParser}; it is NOT plugged into
 * the ActionParser chain - snapshot semantics are cross-state (GS + PTL) and don't fit
 * the per-state ActionParser contract.
 */
import { BlockType } from '@firestone-hs/reference-data';
import { CombinedState } from '../state/combined-state';
import { ParserState } from '../state/parser-state';
import { RewindCardOracle } from './card-oracle';
import { ParserSnapshot, ParserSnapshotMeta, captureParserSnapshot, restoreParserSnapshot } from './snapshot';

/** Stream a log line belongs to. Determines which ParserState the line routes to. */
export type LogStream = 'GS' | 'PTL';

/** Per-stream snapshot entry stored in `gsRetained` / `ptlRetained`. */
interface GsRetainedEntry {
	readonly meta: ParserSnapshotMeta;
	readonly snapshot: ParserSnapshot;
}
type PtlRetainedEntry = GsRetainedEntry;

/** Hard cap on retained snapshots per stream. Rewinds are rare; 16 per stream is plenty. */
const MAX_RETAINED_SNAPSHOTS = 16;

/**
 * Only these block types can plausibly trigger a REWIND. Everything else (FATIGUE, DEATHS,
 * JOUST, POWER of ancillary effects, etc.) can never rewind, and skipping them upfront avoids
 * a catastrophic amount of deep-cloning in long games (hundreds of nested TRIGGER blocks).
 *
 * If a new REWIND-capable block type ever appears, extend this allow-list.
 */
const REWIND_ELIGIBLE_BLOCK_TYPES: ReadonlySet<string> = new Set(['PLAY', 'POWER', 'TRIGGER', 'ATTACK']);

/**
 * Blocks for which we accept an UNKNOWN cardId at BLOCK_START and defer the rewind decision
 * until SHOW_ENTITY. In practice only `PLAY` has that shape - everything else originates from
 * an already-revealed board/hero entity.
 */
const PENDING_ELIGIBLE_BLOCK_TYPES: ReadonlySet<string> = new Set(['PLAY']);

/** Gated by `REWIND_DEBUG=1`; leave it opt-in so production runs stay silent. */
const REWIND_DEBUG = process.env['REWIND_DEBUG'] === '1';

export interface RewindControllerHooks {
	/**
	 * Invoked when the controller takes its FIRST snapshot for a rewind-capable action
	 * (always the GS-side capture, since PTL trails for the same action). Consumers use
	 * this signal to stash their own consumer-level GameState snapshot keyed by the same
	 * originEntityId. The symmetric PTL-side capture that follows is intentionally silent
	 * on this hook to avoid a duplicate consumer-snapshot for the same action.
	 */
	onRewindCapableActionStart?(meta: ParserSnapshotMeta): void;

	/**
	 * Invoked right after a RETAINED snapshot has been restored into `GSState`. At this
	 * point consumers should roll back their GameState snapshot matching the same
	 * originEntityId. The subsequent FULL_ENTITY lines inside the GAME_RESET block are
	 * skipped at the parser level (the snapshot is self-sufficient); see
	 * `replay-parser.ts#insideGameResetGS`.
	 *
	 * Note: only the GS-side restore fires this hook. The matching PTL restore happens
	 * later when PTL reaches its own GAME_RESET BLOCK_START; consumers don't need a second
	 * signal at that point.
	 */
	onRewindRestored?(meta: ParserSnapshotMeta): void;
}

export class RewindController {
	/**
	 * Pending meta-only records on the GS stream for entities whose REWIND status can't be
	 * decided at BLOCK_START. Keyed by originEntityId. Each entry is evicted by a GS-side
	 * SHOW_ENTITY late-promotion (deep-clone iff revealed cardId is rewind-capable) or by
	 * the matching GS root BLOCK_END (silent drop).
	 *
	 * NEVER snapshots - storing the meta alone is O(1) and avoids the deep-clone cost for
	 * the >99% of opponent plays that turn out to be non-rewind.
	 */
	private readonly gsPending = new Map<number, ParserSnapshotMeta>();
	/** Symmetric PTL counterpart of {@link gsPending}. */
	private readonly ptlPending = new Map<number, ParserSnapshotMeta>();

	/**
	 * LIFO stack of GS-side snapshots awaiting GS GAME_RESET. LIFO mirrors Hearthstone's
	 * observed behaviour: nested rewinds (rare) and self-rewinding entities (e.g. Mister
	 * Clockwork firing multiple times) both want the most recent snapshot first.
	 */
	private readonly gsRetained: GsRetainedEntry[] = [];
	/**
	 * LIFO stack of PTL-side snapshots awaiting PTL GAME_RESET. Independent of `gsRetained`
	 * - each stream pops from its own stack at its own GAME_RESET. No cross-stream parking.
	 */
	private readonly ptlRetained: PtlRetainedEntry[] = [];

	/** Depth of open blocks per stream, so we can identify root-level boundaries. */
	private gsDepth = 0;
	private ptlDepth = 0;

	/**
	 * originEntityId of the currently-open root block on each stream. Populated on root
	 * BLOCK_START, cleared on matching root BLOCK_END, used when discarding pending metas.
	 */
	private gsRootOriginEntityId: number | null = null;
	private ptlRootOriginEntityId: number | null = null;

	/**
	 * Per-game instrumentation. Reset on `reset()` (CREATE_GAME) and dumped via a single
	 * `[rewind] perf` line on the next reset. The deep-clone in `captureFor` is the known
	 * dominant cost on this code path - tracking how many we take, how many we throw
	 * away, and how long each one takes is what lets us correlate user-reported freezes /
	 * crashes with rewind activity in production logs.
	 */
	private perf = newPerfStats();

	/**
	 * Latched per-game decision: should we no-op every public observer because the current
	 * game mode cannot host REWIND-capable cards? Battlegrounds (incl. Duos / Friendly) and
	 * Mercenaries don't have the REWIND mechanic at all - running the depth tracker /
	 * pending stash for those games is pure overhead.
	 *
	 *  - `null` while `GameType` is still unknown (the very first lines of a match before
	 *    the metadata block is parsed). In that window we fall through to the regular path;
	 *    in practice no root BLOCK_START arrives before metadata so this is essentially a
	 *    one-line cost.
	 *  - `true` once `IsBattlegrounds()` / `IsMercenaries()` returns true, latched for the
	 *    whole match. Cleared on `reset()` (fresh CREATE_GAME).
	 *  - `false` once we've confirmed the mode is Constructed / Tavern Brawl / etc., also
	 *    latched.
	 */
	private skipForGameMode: boolean | null = null;

	constructor(
		private readonly state: CombinedState,
		private readonly oracle: RewindCardOracle,
		private readonly hooks: RewindControllerHooks = {},
	) {}

	/**
	 * Lazy-and-latched mode gate. Re-checked on every observer call until we get a
	 * definitive answer; once latched the rest of the match takes the cheap branch.
	 */
	private shouldSkipForGameMode(): boolean {
		if (this.skipForGameMode != null) return this.skipForGameMode;
		const gs = this.state.GSState;
		// `IsBattlegrounds()` / `IsMercenaries()` both early-return false on `GameType=-1`
		// (the pre-metadata window). We deliberately don't latch in that case so a real
		// game mode signal can land later.
		if (gs.CurrentGame?.GameType == null || gs.CurrentGame.GameType === -1) return false;
		this.skipForGameMode = gs.IsBattlegrounds() || gs.IsMercenaries();
		return this.skipForGameMode;
	}

	// ---------------------------------------------------------------------------------------
	// Line-level observers. ReplayParser.ReadLine invokes these in the order:
	//   1. observeRewindEvents(stream, line) -> dispatches to onBlockStart / onBlockEnd /
	//      onShowEntity per the line's structural type
	//   2. handleGameResetBlockStart / handleBlockEndForGameReset
	//   3. (actual parsing / AddData)
	// We intentionally don't do the actual parsing here - the controller just records
	// structural events and manages the per-stream snapshot stores.
	// ---------------------------------------------------------------------------------------

	/**
	 * Per-stream BLOCK_START observer. Symmetric for GS and PTL: each stream tracks its
	 * own root depth, its own pending metas, and captures its own snapshot half against
	 * its own retained stack.
	 *
	 * `entityId` / `cardId` / `blockType` are parsed upstream from
	 * {@link Regexes.ActionStartRegex}. Passing them in keeps detection logic out of the
	 * controller and avoids re-parsing.
	 */
	onBlockStart(
		stream: LogStream,
		entityId: number,
		cardId: string | null,
		blockType: string | null,
		timestamp: string,
		isCardOrigin: boolean,
	): void {
		if (this.shouldSkipForGameMode()) return;
		const wasRoot = this.depthFor(stream) === 0;
		this.incrementDepth(stream);
		if (!wasRoot) return;

		this.setRootOrigin(stream, entityId);

		// GAME_RESET is the restoration event, not a candidate.
		if (blockType === (BlockType.GAME_RESET as unknown as string) || blockType === 'GAME_RESET') {
			return;
		}
		// Only card-origin blocks of the right shape can trigger REWIND. Everything else
		// (GameEntity/player triggers, non-rewind block types) would be pure perf waste.
		if (!isCardOrigin) return;
		if (blockType == null || !REWIND_ELIGIBLE_BLOCK_TYPES.has(blockType)) return;

		const meta: ParserSnapshotMeta = {
			originEntityId: entityId,
			originCardId: cardId && cardId.length > 0 ? cardId : null,
			blockType,
			capturedAt: timestamp,
		};

		const known = meta.originCardId != null;
		if (known) {
			if (this.oracle.hasRewindMechanic(meta.originCardId)) {
				if (REWIND_DEBUG)
					console.log(
						`[rewind] retain known ${stream} cardId=${meta.originCardId} entityId=${entityId}`,
					);
				this.captureFor(stream, meta);
			}
			// cardId known but NOT rewind-capable: don't snapshot at all.
			return;
		}

		// cardId unknown at BLOCK_START - typical for opponent PLAY blocks. Stash *only the
		// meta* (no deep clone) and defer the snapshot decision to SHOW_ENTITY. We only do
		// this for PLAY because that's the only block type where the origin card might be
		// unrevealed.
		if (!PENDING_ELIGIBLE_BLOCK_TYPES.has(blockType)) return;
		if (REWIND_DEBUG)
			console.log(`[rewind] stash pending ${stream} entityId=${entityId} blockType=${blockType}`);
		this.stashPendingFor(stream, meta);
	}

	/**
	 * Per-stream SHOW_ENTITY observer. If we have a deferred pending meta for this entity
	 * on this stream, decide now: capture-and-retain when the revealed card is rewind-
	 * capable, or silently drop the meta otherwise.
	 *
	 * The capture happens here, not at BLOCK_START: deep-cloning the parser graph is the
	 * dominant cost, so paying it only on confirmed rewind cards (a handful per match at
	 * most) instead of on every opponent PLAY (10-30 per match) is the central perf win of
	 * this controller.
	 */
	onShowEntity(stream: LogStream, entityId: number, cardId: string | null): void {
		if (this.shouldSkipForGameMode()) return;
		const pending = this.pendingMapFor(stream);
		const pendingMeta = pending.get(entityId);
		if (REWIND_DEBUG)
			console.log(
				`[rewind] onShowEntity ${stream} entityId=${entityId} cardId=${cardId} pendingMeta=${
					pendingMeta != null
				}`,
			);
		if (pendingMeta == null) return;

		const isRewind = this.oracle.hasRewindMechanic(cardId);
		pending.delete(entityId);

		if (REWIND_DEBUG) console.log(`[rewind] promote decision ${stream}: isRewind=${isRewind}`);
		if (!isRewind) {
			this.perf.pendingDiscarded++;
			return;
		}
		this.perf.pendingPromoted++;

		// Re-stamp the meta with the revealed cardId so downstream consumers see the real
		// card, then deep-clone *now* on this stream.
		const resolvedMeta: ParserSnapshotMeta = { ...pendingMeta, originCardId: cardId ?? null };
		this.captureFor(stream, resolvedMeta);
	}

	/**
	 * Per-stream BLOCK_END observer. Decrements depth; on root-level close, discards any
	 * pending meta on the same stream whose origin matches (no SHOW_ENTITY ever resolved
	 * it - e.g. a play that resolved without a card reveal).
	 */
	onBlockEnd(stream: LogStream): void {
		if (this.shouldSkipForGameMode()) return;
		this.decrementDepth(stream);
		if (this.depthFor(stream) !== 0) return;
		const origin = this.rootOriginFor(stream);
		if (origin == null) return;
		const pending = this.pendingMapFor(stream);
		if (pending.delete(origin)) {
			// Meta dropped at root close without ever capturing - the cheap path.
			// Counts as a discard for perf purposes (a candidate that didn't snapshot).
			this.perf.pendingDiscarded++;
		}
		this.setRootOrigin(stream, null);
	}

	/**
	 * GameState-stream GAME_RESET has started for `originEntityId`. Pop the matching entry
	 * from `gsRetained`, restore GSState in place, and return the snapshot meta so the
	 * caller can emit the REWIND_STARTED event. Returns null if no entry matches (caller
	 * should fall back to legacy behaviour - e.g. `ParserState.PartialReset()`).
	 *
	 * Does NOT touch `ptlRetained` - the PTL-side restore lives in
	 * {@link onPtlGameResetStart}, which independently pops from its own stack when the
	 * PTL stream emits its matching GAME_RESET BLOCK_START some time later.
	 */
	onGsGameResetStart(originEntityId: number): ParserSnapshotMeta | null {
		if (this.shouldSkipForGameMode()) return null;
		if (REWIND_DEBUG)
			console.log(
				`[rewind] onGsGameResetStart entityId=${originEntityId} gsRetained=${this.gsRetained.length}`,
			);
		const idx = findLastIndex(this.gsRetained, (s) => s.meta.originEntityId === originEntityId);
		if (idx < 0) {
			console.debug(`No GS retained snapshot for rewind origin entityId=${originEntityId}`, '');
			return null;
		}
		const entry = this.gsRetained[idx];
		this.gsRetained.splice(idx, 1);

		restoreParserSnapshot(this.state.GSState, entry.snapshot);
		this.hooks.onRewindRestored?.(entry.meta);
		return entry.meta;
	}

	/**
	 * PowerTaskList-stream GAME_RESET has started for `originEntityId`. Pop the matching
	 * entry from `ptlRetained` and restore PTLState in place. Returns the snapshot meta on
	 * success, null when no entry matches (caller falls back to legacy GameResetParser).
	 *
	 * Symmetric to {@link onGsGameResetStart} - PTL owns its own restore lifecycle, no
	 * cross-stream parking.
	 */
	onPtlGameResetStart(originEntityId: number): ParserSnapshotMeta | null {
		if (this.shouldSkipForGameMode()) return null;
		if (REWIND_DEBUG)
			console.log(
				`[rewind] onPtlGameResetStart entityId=${originEntityId} ptlRetained=${this.ptlRetained.length}`,
			);
		const idx = findLastIndex(this.ptlRetained, (s) => s.meta.originEntityId === originEntityId);
		if (idx < 0) {
			console.debug(`No PTL retained snapshot for rewind origin entityId=${originEntityId}`, '');
			return null;
		}
		const entry = this.ptlRetained[idx];
		this.ptlRetained.splice(idx, 1);

		restoreParserSnapshot(this.state.PTLState, entry.snapshot);
		return entry.meta;
	}

	// ---------------------------------------------------------------------------------------
	// Internals
	// ---------------------------------------------------------------------------------------

	/**
	 * Capture the snapshot half for the given stream and push onto its retained stack.
	 *
	 * The consumer hook fires from GS captures only - GS is always the first capture for
	 * a given action (PTL trails the same action by O(ms..s) of stream lag), so this is
	 * "fire exactly once per rewind-capable action". The symmetric PTL capture is
	 * intentionally silent on the hook to avoid a duplicate consumer snapshot for the
	 * same action.
	 */
	private captureFor(stream: LogStream, meta: ParserSnapshotMeta): void {
		const t0 = Date.now();
		if (stream === 'GS') {
			const gs = captureParserSnapshot(this.state.GSState, meta);
			this.recordSnapshotMs(Date.now() - t0, meta, 'GS-half');
			this.gsRetained.push({ meta, snapshot: gs });
			this.trimStack(this.gsRetained);
			this.perf.retainedSnapshotsTaken++;
			this.hooks.onRewindCapableActionStart?.(meta);
		} else {
			const ptl = captureParserSnapshot(this.state.PTLState, meta);
			this.recordSnapshotMs(Date.now() - t0, meta, 'PTL-half');
			this.ptlRetained.push({ meta, snapshot: ptl });
			this.trimStack(this.ptlRetained);
			this.perf.retainedSnapshotsTaken++;
		}
	}

	private stashPendingFor(stream: LogStream, meta: ParserSnapshotMeta): void {
		this.perf.pendingTracked++;
		this.perf.lastBlockType = meta.blockType;
		this.pendingMapFor(stream).set(meta.originEntityId, meta);
	}

	private recordSnapshotMs(dt: number, meta: ParserSnapshotMeta, label: 'GS-half' | 'PTL-half'): void {
		this.perf.totalSnapshotMs += dt;
		if (dt > this.perf.maxSnapshotMs) this.perf.maxSnapshotMs = dt;
		// One-shot warn for genuinely user-visible single-clone stalls. 50ms is the rough
		// boundary above which a clone is itself measurable as a UI freeze on the renderer
		// thread; below that the per-game summary on reset() is enough signal.
		if (dt > 50) {
			console.warn(
				`[rewind] slow ${label} capture ${dt}ms`,
				'blockType',
				meta.blockType,
				'originEntityId',
				meta.originEntityId,
				'originCardId',
				meta.originCardId,
			);
		}
	}

	private trimStack(stack: { length: number; shift(): unknown }): void {
		while (stack.length > MAX_RETAINED_SNAPSHOTS) {
			stack.shift();
		}
	}

	private depthFor(stream: LogStream): number {
		return stream === 'GS' ? this.gsDepth : this.ptlDepth;
	}

	private incrementDepth(stream: LogStream): void {
		if (stream === 'GS') this.gsDepth++;
		else this.ptlDepth++;
	}

	private decrementDepth(stream: LogStream): void {
		if (stream === 'GS') {
			if (this.gsDepth > 0) this.gsDepth--;
		} else {
			if (this.ptlDepth > 0) this.ptlDepth--;
		}
	}

	private pendingMapFor(stream: LogStream): Map<number, ParserSnapshotMeta> {
		return stream === 'GS' ? this.gsPending : this.ptlPending;
	}

	private rootOriginFor(stream: LogStream): number | null {
		return stream === 'GS' ? this.gsRootOriginEntityId : this.ptlRootOriginEntityId;
	}

	private setRootOrigin(stream: LogStream, value: number | null): void {
		if (stream === 'GS') this.gsRootOriginEntityId = value;
		else this.ptlRootOriginEntityId = value;
	}

	// ---------------------------------------------------------------------------------------
	// Visible for tests / diagnostics
	// ---------------------------------------------------------------------------------------

	/** Total pending metas across both streams. Kept for legacy mode-gate tests. */
	_pendingSize(): number {
		return this.gsPending.size + this.ptlPending.size;
	}
	/** Total retained snapshots across both streams. Kept for legacy mode-gate tests. */
	_retainedSize(): number {
		return this.gsRetained.length + this.ptlRetained.length;
	}
	_gsPendingSize(): number {
		return this.gsPending.size;
	}
	_ptlPendingSize(): number {
		return this.ptlPending.size;
	}
	_gsRetainedSize(): number {
		return this.gsRetained.length;
	}
	_ptlRetainedSize(): number {
		return this.ptlRetained.length;
	}

	/** Reset all controller state. Called when ReplayParser sees a fresh CREATE_GAME. */
	reset(): void {
		// Emit a one-line summary of the previous game's snapshot activity before zeroing.
		// Skipped on the very first reset (no prior game) to avoid noise on the first match.
		if (this.perf.pendingTracked > 0 || this.perf.retainedSnapshotsTaken > 0) {
			console.log('[rewind] perf', {
				pendingTracked: this.perf.pendingTracked,
				pendingDiscarded: this.perf.pendingDiscarded,
				pendingPromoted: this.perf.pendingPromoted,
				retainedTaken: this.perf.retainedSnapshotsTaken,
				totalSnapshotMs: this.perf.totalSnapshotMs,
				maxSnapshotMs: this.perf.maxSnapshotMs,
				lastBlockType: this.perf.lastBlockType,
			});
		}
		this.gsPending.clear();
		this.ptlPending.clear();
		this.gsRetained.length = 0;
		this.ptlRetained.length = 0;
		this.gsDepth = 0;
		this.ptlDepth = 0;
		this.gsRootOriginEntityId = null;
		this.ptlRootOriginEntityId = null;
		this.perf = newPerfStats();
		this.skipForGameMode = null;
	}
}

interface RewindPerfStats {
	/** Opponent PLAY blocks observed at root level (deferred-meta candidates). */
	pendingTracked: number;
	/** Pending metas dropped without doing any deep-clone work (the cheap, common path). */
	pendingDiscarded: number;
	/** Pending metas promoted to a captured snapshot at SHOW_ENTITY (rare, REWIND-card). */
	pendingPromoted: number;
	/** Per-stream-half captures pushed onto either retained stack. */
	retainedSnapshotsTaken: number;
	totalSnapshotMs: number;
	maxSnapshotMs: number;
	lastBlockType: string | null;
}

function newPerfStats(): RewindPerfStats {
	return {
		pendingTracked: 0,
		pendingDiscarded: 0,
		pendingPromoted: 0,
		retainedSnapshotsTaken: 0,
		totalSnapshotMs: 0,
		maxSnapshotMs: 0,
		lastBlockType: null,
	};
}

// Polyfill for Array.prototype.findLastIndex (not available in all TS targets used here).
function findLastIndex<T>(arr: readonly T[], pred: (v: T) => boolean): number {
	for (let i = arr.length - 1; i >= 0; i--) {
		if (pred(arr[i])) return i;
	}
	return -1;
}

// Silence unused-import warning in TS configs that tree-shake: we genuinely need the types
// transitively for the snapshot helpers.
void ParserState;
