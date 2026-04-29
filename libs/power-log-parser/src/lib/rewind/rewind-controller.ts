/**
 * Parser-side rewind controller.
 *
 * Owns the snapshot/restore lifecycle around root-level BLOCK_STARTs:
 *  - Every root-level BLOCK_START on the GameState stream is a *candidate* rewind anchor.
 *    Why "root-level" only? REWIND is always the top-level intent of whatever the player did
 *    (PLAY / POWER / TRIGGER / ATTACK); inner blocks are effects and can never be rewound
 *    independently.
 *  - Why the GS stream specifically? GameState logs emit before PowerTaskList for the same
 *    action, so GS root BLOCK_START is the last moment where both states are simultaneously
 *    "pre-action". Taking the snapshot at PTL BLOCK_START would be too late for GSState.
 *  - If the origin entity's `cardId` is already known (our own card, or an opponent card that
 *    was revealed earlier), we decide immediately via the {@link RewindCardOracle} whether
 *    this card statically carries the REWIND mechanic. Only then do we deep-clone.
 *  - If the `cardId` is unknown at BLOCK_START (typical for opponent cards played from hand
 *    - logged as `UNKNOWN HUMAN PLAYER` / `cardId=""`), we **defer**: only the meta is
 *    stashed PENDING (no clone). A later `SHOW_ENTITY` inside the block either promotes the
 *    pending to a RETAINED *captured-now* snapshot (REWIND mechanic confirmed) or the
 *    pending is silently dropped (zero clone work).
 *
 *    The deferred capture trades a little correctness slack for a huge perf win: in a typical
 *    Hearthstone match, opponents play 10-30 cards, of which essentially zero are REWIND-
 *    capable, so eagerly cloning at BLOCK_START burned the deep-clone cost on every play just
 *    to throw it away on SHOW_ENTITY. The slack: capturing at SHOW_ENTITY time means the
 *    snapshot has the action's preceding `TAG_CHANGE` lines (typically just the played
 *    entity's ZONE flip from HAND to PLAY) already applied. The post-rewind GAME_RESET block
 *    re-emits authoritative `FULL_ENTITY` lines that overwrite this small drift, which the
 *    rewind golden suite (`test-tools/non-reg/rewind-nonreg.spec.ts`) verifies end-to-end.
 *  - On `GAME_RESET` close (PTL stream only), we look up the RETAINED snapshot for the block's
 *    origin entity and restore. Matching is LIFO over originEntityId because a single entity
 *    (e.g. Mister Clockwork) can rewind multiple times in a game and we can't trust
 *    USED_REWIND to mark individual slots as consumed.
 *
 * The controller is a plain class owned by {@link ReplayParser}; it is NOT plugged into the
 * ActionParser chain - snapshot semantics are cross-state (GS + PTL) and don't fit the
 * per-state ActionParser contract.
 */
import { BlockType } from '@firestone-hs/reference-data';
import { CombinedState } from '../state/combined-state';
import { ParserState } from '../state/parser-state';
import { Logger } from '../logger';
import { RewindCardOracle } from './card-oracle';
import {
	ParserSnapshot,
	ParserSnapshotMeta,
	captureParserSnapshot,
	restoreParserSnapshot,
} from './snapshot';

/** Stream a log line belongs to. Determines which ParserState the line routes to. */
export type LogStream = 'GS' | 'PTL';

/** A captured snapshot of both ParserStates, plus the meta we need to match on restore. */
export interface CombinedSnapshot {
	readonly meta: ParserSnapshotMeta;
	readonly gs: ParserSnapshot;
	readonly ptl: ParserSnapshot;
}

/** Hard cap on retained snapshots. Rewinds happen at most a few per match; 16 is plenty. */
const MAX_RETAINED_SNAPSHOTS = 16;

/**
 * Only these block types can plausibly trigger a REWIND. Everything else (FATIGUE, DEATHS,
 * JOUST, POWER of ancillary effects, etc.) can never rewind, and skipping them upfront avoids
 * a catastrophic amount of deep-cloning in long games (hundreds of nested TRIGGER blocks).
 *
 * If a new REWIND-capable block type ever appears, extend this allow-list.
 */
const REWIND_ELIGIBLE_BLOCK_TYPES: ReadonlySet<string> = new Set([
	'PLAY',
	'POWER',
	'TRIGGER',
	'ATTACK',
]);

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
	 * Invoked when the controller has just taken a RETAINED snapshot (either eagerly because
	 * the REWIND mechanic was known at BLOCK_START, or after a SHOW_ENTITY late-promotion).
	 * Consumers use this signal to stash their own consumer-level GameState snapshot keyed
	 * by the same originEntityId.
	 */
	onRewindCapableActionStart?(meta: ParserSnapshotMeta): void;

	/**
	 * Invoked right after a RETAINED snapshot has been restored into the live ParserStates.
	 * At this point consumers should roll back their GameState snapshot matching the same
	 * originEntityId. The subsequent FULL_ENTITY lines inside the GAME_RESET block are the
	 * server's authoritative post-rewind state; they'll flow through the parser normally but
	 * we suppress their consumer-visible events (see parser-silence-reset-block).
	 */
	onRewindRestored?(meta: ParserSnapshotMeta): void;
}

export class RewindController {
	/**
	 * Pending *meta-only* records for entities whose REWIND status can't be decided at
	 * BLOCK_START (typically opponent cards with an UNKNOWN cardId). Keyed by originEntityId.
	 *
	 * Critically, these are **not** snapshots - storing the meta alone is O(1) and avoids the
	 * deep-clone cost of {@link captureCombined} for the >99% of opponent plays that turn
	 * out to be non-rewind on SHOW_ENTITY reveal. Each entry is evicted either by a
	 * SHOW_ENTITY late-promotion (where we deep-clone *iff* the revealed cardId is rewind-
	 * capable) or by the root BLOCK_END (silent drop).
	 */
	private readonly pending = new Map<number, ParserSnapshotMeta>();
	/**
	 * LIFO stack of retained snapshots, one per rewind-capable action whose GAME_RESET hasn't
	 * yet arrived. LIFO matches Hearthstone's observed behaviour: nested rewinds (rare) and
	 * self-rewinding entities (e.g. Mister Clockwork firing multiple times) both want the
	 * most recent snapshot first.
	 */
	private readonly retained: CombinedSnapshot[] = [];
	/**
	 * PTL snapshot halves parked between GS-side GAME_RESET (which restores GSState and moves
	 * entries here) and PTL-side GAME_RESET (which consumes them). The two GAME_RESET blocks
	 * for the same rewind arrive on different streams at different times, so we can't restore
	 * both states simultaneously.
	 */
	private readonly pendingPtlRestores: Array<{
		originEntityId: number;
		ptlSnapshot: ParserSnapshot;
		meta: ParserSnapshotMeta;
	}> = [];

	/** Depth of open blocks per stream, so we can identify root-level boundaries. */
	private gsDepth = 0;
	private ptlDepth = 0;

	/**
	 * originEntityId of the currently-open root block on each stream. Populated on root
	 * BLOCK_START, cleared on matching root BLOCK_END, used when discarding pending snapshots.
	 */
	private gsRootOriginEntityId: number | null = null;

	/**
	 * Per-game instrumentation. Reset on `reset()` (CREATE_GAME) and dumped via a single
	 * `[rewind] perf` line on the next reset. The deep-clone in `captureCombined` is the
	 * known dominant cost on this code path - tracking how many we take, how many we throw
	 * away, and how long each one takes is what lets us correlate user-reported freezes /
	 * crashes with rewind activity in production logs.
	 */
	private perf = newPerfStats();

	constructor(
		private readonly state: CombinedState,
		private readonly oracle: RewindCardOracle,
		private readonly hooks: RewindControllerHooks = {},
	) {}

	// ---------------------------------------------------------------------------------------
	// Line-level observers. ReplayParser.ReadLine invokes these in the order:
	//   1. observeBeforeParse(line, stream)
	//   2. (actual parsing / AddData)
	// We intentionally don't do the actual parsing here - the controller just records
	// structural events (block boundaries, entity reveals) and manages the snapshot store.
	// ---------------------------------------------------------------------------------------

	/**
	 * Call at the top of ReadLine, before any dispatch. The controller uses this to detect
	 * root-level BLOCK_START on the GS stream and to take snapshots.
	 *
	 * `entityId` / `cardId` / `blockType` are parsed upstream from {@link Regexes.ActionStartRegex}.
	 * Passing them in keeps detection logic out of the controller and avoids re-parsing.
	 */
	onBlockStart(
		stream: LogStream,
		entityId: number,
		cardId: string | null,
		blockType: string | null,
		timestamp: string,
		isCardOrigin: boolean,
	): void {
		const wasRoot = this.depthFor(stream) === 0;
		this.incrementDepth(stream);

		if (!wasRoot) return;
		if (stream !== 'GS') {
			// PTL root blocks arrive after GS root blocks for the same action; taking a snapshot
			// here would be too late for the GS side (GS has already applied the action). We
			// still record origin so BLOCK_END depth bookkeeping works.
			return;
		}

		this.gsRootOriginEntityId = entityId;

		// Skip GAME_RESET blocks themselves - they're the restoration event, not the trigger.
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
				if (REWIND_DEBUG) console.log(`[rewind] retain known cardId=${meta.originCardId} entityId=${entityId}`);
				this.retainSnapshot(meta);
			}
			// cardId known but NOT rewind-capable: don't snapshot at all.
			return;
		}

		// cardId unknown at BLOCK_START - typical for opponent PLAY blocks. Stash *only the
		// meta* (no deep clone) and defer the snapshot decision to SHOW_ENTITY: by then the
		// cardId is known, so we either capture-on-promote (rare, rewind-capable card) or
		// drop the meta (the overwhelmingly common case). We only do this for PLAY because
		// that's the only block type where the origin card might be unrevealed (others
		// always have a known board/hero card).
		if (!PENDING_ELIGIBLE_BLOCK_TYPES.has(blockType)) return;
		if (REWIND_DEBUG) console.log(`[rewind] stash pending meta entityId=${entityId} blockType=${blockType}`);
		this.stashPendingMeta(meta);
	}

	/**
	 * Call when a SHOW_ENTITY line is parsed and the entity's `cardId` is now known. If we
	 * have a deferred pending meta for this entity, decide now: capture-and-retain when the
	 * revealed card is rewind-capable, or silently drop the meta otherwise.
	 *
	 * The capture happens *here*, not at BLOCK_START: deep-cloning the parser graph is the
	 * dominant cost, so paying it only on confirmed rewind cards (a handful per match at
	 * most) instead of on every opponent PLAY (10-30 per match) is the central perf win of
	 * this controller.
	 */
	onShowEntity(entityId: number, cardId: string | null): void {
		const pendingMeta = this.pending.get(entityId);
		if (REWIND_DEBUG) console.log(`[rewind] onShowEntity entityId=${entityId} cardId=${cardId} pendingMeta=${pendingMeta != null}`);
		if (pendingMeta == null) return;

		const isRewind = this.oracle.hasRewindMechanic(cardId);
		this.pending.delete(entityId);

		if (REWIND_DEBUG) console.log(`[rewind] promote decision: isRewind=${isRewind}`);
		if (!isRewind) {
			this.perf.pendingDiscarded++;
			return;
		}
		this.perf.pendingPromoted++;

		// Re-stamp the meta with the revealed cardId so downstream consumers see the real
		// card, then deep-clone *now*: this is the deferred capture point. Note that the
		// captured state has the BLOCK_START line and any intervening TAG_CHANGE lines (most
		// commonly the played entity's ZONE flip from HAND to PLAY) already applied. The
		// post-rewind GAME_RESET block re-emits authoritative FULL_ENTITY lines that
		// overwrite that minor drift; the rewind goldens cover this end-to-end.
		const resolvedMeta: ParserSnapshotMeta = { ...pendingMeta, originCardId: cardId ?? null };
		const captured = this.captureCombined(resolvedMeta);
		this.retained.push(captured);
		this.trimRetained();
		this.hooks.onRewindCapableActionStart?.(resolvedMeta);
	}

	/**
	 * Call when a BLOCK_END is parsed. Decrements depth; on root-level close, discards any
	 * pending meta whose origin matches (no SHOW_ENTITY ever resolved it → card wasn't
	 * revealed inside this block, e.g. a play that resolved without a card reveal).
	 */
	onBlockEnd(stream: LogStream): void {
		this.decrementDepth(stream);
		if (stream === 'GS' && this.depthFor('GS') === 0) {
			if (this.gsRootOriginEntityId != null) {
				if (this.pending.delete(this.gsRootOriginEntityId)) {
					// Meta dropped at root close without ever capturing - the cheap path.
					// Counts as a discard for perf purposes (a candidate that didn't snapshot).
					this.perf.pendingDiscarded++;
				}
				this.gsRootOriginEntityId = null;
			}
		}
	}

	/**
	 * GameState-stream GAME_RESET has started for `originEntityId`. Restore GSState immediately
	 * and stash the PTL half so PTL's matching GAME_RESET can apply it later (PTL logs lag
	 * behind GS for the same action). Returns the snapshot meta so the caller can emit the
	 * REWIND_STARTED event with `originEntityId`. Returns null if no retained snapshot matches
	 * (caller should fall back to legacy behaviour - e.g. `ParserState.PartialReset()`).
	 */
	onGsGameResetStart(originEntityId: number): ParserSnapshotMeta | null {
		if (REWIND_DEBUG) console.log(`[rewind] onGsGameResetStart entityId=${originEntityId} retained=${this.retained.length}`);
		const idx = findLastIndex(this.retained, (s) => s.meta.originEntityId === originEntityId);
		if (idx < 0) {
			Logger.Log(`No retained snapshot for rewind origin entityId=${originEntityId}`, '');
			return null;
		}
		const snapshot = this.retained[idx];
		this.retained.splice(idx, 1);

		restoreParserSnapshot(this.state.GSState, snapshot.gs);
		this.pendingPtlRestores.push({
			originEntityId,
			ptlSnapshot: snapshot.ptl,
			meta: snapshot.meta,
		});
		this.hooks.onRewindRestored?.(snapshot.meta);
		return snapshot.meta;
	}

	/**
	 * PowerTaskList-stream GAME_RESET has started for `originEntityId`. Restore PTLState from
	 * the snapshot half parked by {@link onGsGameResetStart}. Returns null if no matching entry
	 * exists (meaning we never saw the GS-side GAME_RESET - shouldn't happen in practice).
	 */
	onPtlGameResetStart(originEntityId: number): ParserSnapshotMeta | null {
		const idx = findLastIndex(this.pendingPtlRestores, (e) => e.originEntityId === originEntityId);
		if (idx < 0) {
			Logger.Log(`No parked PTL snapshot for rewind origin entityId=${originEntityId}`, '');
			return null;
		}
		const entry = this.pendingPtlRestores[idx];
		this.pendingPtlRestores.splice(idx, 1);

		restoreParserSnapshot(this.state.PTLState, entry.ptlSnapshot);
		return entry.meta;
	}

	// ---------------------------------------------------------------------------------------
	// Internals
	// ---------------------------------------------------------------------------------------

	private retainSnapshot(meta: ParserSnapshotMeta): void {
		const combined = this.captureCombined(meta);
		this.perf.retainedSnapshotsTaken++;
		this.retained.push(combined);
		this.trimRetained();
		this.hooks.onRewindCapableActionStart?.(meta);
	}

	private stashPendingMeta(meta: ParserSnapshotMeta): void {
		this.perf.pendingTracked++;
		this.perf.lastBlockType = meta.blockType;
		this.pending.set(meta.originEntityId, meta);
	}

	private captureCombined(meta: ParserSnapshotMeta): CombinedSnapshot {
		const t0 = Date.now();
		const result: CombinedSnapshot = {
			meta,
			gs: captureParserSnapshot(this.state.GSState, meta),
			ptl: captureParserSnapshot(this.state.PTLState, meta),
		};
		const dt = Date.now() - t0;
		this.perf.totalSnapshotMs += dt;
		if (dt > this.perf.maxSnapshotMs) this.perf.maxSnapshotMs = dt;
		// One-shot warn for genuinely user-visible single-snapshot stalls. 50ms is the rough
		// boundary above which a clone is itself measurable as a UI freeze on the renderer
		// thread; below that the per-game summary on reset() is enough signal.
		if (dt > 50) {
			console.warn(
				`[rewind] slow captureCombined ${dt}ms`,
				'blockType',
				meta.blockType,
				'originEntityId',
				meta.originEntityId,
				'originCardId',
				meta.originCardId,
			);
		}
		return result;
	}

	private trimRetained(): void {
		while (this.retained.length > MAX_RETAINED_SNAPSHOTS) {
			this.retained.shift();
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

	/** Visible for tests / diagnostics. */
	_pendingSize(): number {
		return this.pending.size;
	}
	_retainedSize(): number {
		return this.retained.length;
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
		this.pending.clear();
		this.retained.length = 0;
		this.pendingPtlRestores.length = 0;
		this.gsDepth = 0;
		this.ptlDepth = 0;
		this.gsRootOriginEntityId = null;
		this.perf = newPerfStats();
	}
}

interface RewindPerfStats {
	/** Opponent PLAY blocks observed at root level (deferred-meta candidates). */
	pendingTracked: number;
	/** Pending metas dropped without doing any deep-clone work (the cheap, common path). */
	pendingDiscarded: number;
	/** Pending metas promoted to a captured snapshot at SHOW_ENTITY (rare, REWIND-card). */
	pendingPromoted: number;
	/** Eagerly-captured snapshots (cardId already known to be REWIND-capable at BLOCK_START). */
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
