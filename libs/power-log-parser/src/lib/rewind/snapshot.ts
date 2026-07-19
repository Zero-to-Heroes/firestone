/**
 * Rewind snapshot / restore for the parser-internal ParserState.
 *
 * The high-level contract:
 *  - `captureParserSnapshot(state, meta)` builds an opaque snapshot of everything the parser
 *    needs to rewind to a prior point in the replay.
 *  - `restoreParserSnapshot(state, snapshot)` mutates the live `ParserState` AND its live
 *    `GameState` instance in place. This is critical: every `ActionParser` (Recruit, Passive,
 *    MinionBackOnBoard, ...) caches a reference to `parserState.GameState` in its constructor.
 *    If we ever swap `state.GameState` out for a different instance, every parser ends up
 *    reading from a stale Map while subsequent FULL_ENTITY / TAG_CHANGE lines mutate the new
 *    one - leading to `CurrentEntities.get(id)!.GetTag(...)` crashes because the entity was
 *    registered on "the other" map.
 *
 * We snapshot by deep-cloning the mutable data graph (ParserState fields, GameState entity
 * map, CurrentGame.Data, the in-flight Node tree) while preserving class prototypes so that
 * `instanceof FullEntity` etc. keep holding. Shared service references (`NodeParser`,
 * `StateFacade`) and the back-edge `GameState.ParserState` are preserved by reference rather
 * than cloned - the live ParserState instance is the only one that ever exists.
 */
import { HearthstoneReplay } from '../models';
import { GameState } from '../state/game-state';
import { ParserState } from '../state/parser-state';

/**
 * Fields on ParserState we snapshot/restore. Services (NodeParser, StateFacade) are NOT here.
 *
 * Note: `GameState` is listed here so we can CLONE it for the snapshot, but on restore it
 * gets special-cased (see {@link restoreParserSnapshot}) to mutate the live instance instead
 * of replacing it - see the class-level JSDoc above for why.
 */
const PARSER_STATE_FIELDS = [
	'GameState',
	'Replay',
	'CurrentGame',
	'GameData',
	'SendChoices',
	'Choices',
	'Options',
	'CurrentOption',
	'LastOption',
	'CurrentSubSpell',
	'FirstPlayerEntityId',
	'CurrentPlayerId',
	'CurrentChosenEntites',
	'Ended',
	'NumberOfCreates',
	'ReconnectionOngoing',
	'Spectating',
	'StateType',
	// Private-but-enumerable backing fields of the Node/LocalPlayer/OpponentPlayer getters.
	'_node',
	'_localPlayer',
	'_opponentPlayer',
	// Perf caches - snapshot & restore so we don't return stale cached values post-rewind.
	'_cachedPlayers',
	'_isBattlegrounds',
	// Entity index over CurrentGame.Data - must be cloned with the same `seen` map as
	// CurrentGame so post-restore lookups resolve to the restored entity objects.
	'_entityIndex',
] as const;

export interface ParserSnapshotMeta {
	/** EntityId of the root block origin that made us take this snapshot. */
	readonly originEntityId: number;
	/** CardId when known at snapshot time (may be '' / 'UNKNOWN HUMAN PLAYER' for opponents). */
	readonly originCardId: string | null;
	/** Block type (e.g. 'PLAY', 'POWER', 'TRIGGER', 'ATTACK') for diagnostics. */
	readonly blockType: string | null;
	/** Timestamp on the BLOCK_START line, for diagnostics only. */
	readonly capturedAt: string;
}

export interface ParserSnapshot extends ParserSnapshotMeta {
	/**
	 * Cloned values for every field in {@link PARSER_STATE_FIELDS}. Kept as a plain record to
	 * emphasise this is opaque data, not a ParserState.
	 */
	readonly fields: Readonly<Record<string, unknown>>;
}

/**
 * Capture a deep snapshot of the ParserState's mutable data graph.
 *
 * The snapshot preserves class identity (instanceof still works) and handles the cycles
 * introduced by GameState.ParserState and node parent chains.
 */
export function captureParserSnapshot(state: ParserState, meta: ParserSnapshotMeta): ParserSnapshot {
	const refs = collectSharedRefs(state);
	// One shared `seen` across all fields so that objects shared between ParserState fields
	// (e.g. `CurrentGame` and the root of the `_node` chain, `GameState.CurrentEntities`
	// entries reachable from `CurrentGame.Data`) are cloned exactly once and preserve their
	// intra-snapshot identity.
	const seen = new WeakMap<object, unknown>();
	const out: Record<string, unknown> = {};
	for (const field of PARSER_STATE_FIELDS) {
		const value = (state as unknown as Record<string, unknown>)[field];
		out[field] = deepClone(value, seen, refs);
	}
	return { ...meta, fields: out };
}

/**
 * Restore the live ParserState in place from a previously captured snapshot.
 *
 * Identity preservation is critical: every `ActionParser` caches a `GameState` reference in
 * its constructor (`this.GameState = parserState.GameState`). If we replaced `state.GameState`
 * with the cloned snapshot, those parsers would keep reading from the stale pre-restore map
 * while the new map gets all the post-restore FULL_ENTITY / TAG_CHANGE mutations - entities
 * would be "missing" from the parsers' view and `CurrentEntities.get(id)!` calls would crash.
 *
 * Instead we mutate the live `state.GameState` (and `state` itself) in place: clear every
 * enumerable own property, then copy the cloned snapshot's properties back in.
 */
export function restoreParserSnapshot(state: ParserState, snapshot: ParserSnapshot): void {
	const refs = collectSharedRefs(state);
	const seen = new WeakMap<object, unknown>();
	for (const field of PARSER_STATE_FIELDS) {
		const captured = snapshot.fields[field];
		const restored = deepClone(captured, seen, refs);

		if (field === 'GameState') {
			// In-place mutation - see JSDoc above.
			mutateInPlace(state.GameState as unknown as Record<string, unknown>, restored as Record<string, unknown>);
			continue;
		}
		(state as unknown as Record<string, unknown>)[field] = restored;
	}
	// Re-link the back-edge: GameState.ParserState must point at the live ParserState (the
	// snapshot's clone would have cloned this to a phantom object if we weren't careful).
	if (state.GameState != null) {
		state.GameState.ParserState = state;
	}
}

/**
 * Replace every enumerable own property on `target` with the corresponding value on `source`.
 * Properties that exist on `target` but not on `source` are deleted so the final state is
 * exactly `source`'s shape - important for cleared Map caches like `CurrentEntities` after
 * a reset.
 */
function mutateInPlace(target: Record<string, unknown>, source: Record<string, unknown>): void {
	for (const key of Object.keys(target)) {
		if (!Object.prototype.hasOwnProperty.call(source, key)) {
			delete target[key];
		}
	}
	for (const key of Object.keys(source)) {
		target[key] = source[key];
	}
}

/**
 * Produce the set of live object references that must NOT be cloned (either because they are
 * shared services whose identity matters, or because they'd cause infinite recursion through a
 * back-edge to the live ParserState).
 */
function collectSharedRefs(state: ParserState): WeakSet<object> {
	const refs = new WeakSet<object>();
	const services: unknown[] = [
		state, // ParserState back-refs on GameState should stay live.
		state.NodeParser,
		state.StateFacade,
	];
	for (const s of services) {
		if (s != null && typeof s === 'object') refs.add(s as object);
	}
	return refs;
}

/**
 * Structural deep clone that:
 *  - Preserves prototypes (so `instanceof FullEntity` survives).
 *  - Handles Map, Set, Array.
 *  - Handles cycles via a WeakMap.
 *  - Returns preserved objects (from `preserve`) by reference without cloning.
 *  - Skips function/symbol values.
 *
 * Iterative (NOT recursive) on purpose: the cloned graph here is the live parser state
 * (GameState entity map, `CurrentGame.Data`, and the in-flight `Node` tree whose `Parent`
 * back-edges form a chain as deep as the current block nesting). In long games that chain
 * - and the entity graph reachable from it - can get deep enough that a recursive clone
 * blows the JS call stack with `RangeError: Maximum call stack size exceeded`. That throw
 * surfaces as a `[ProcessingQueue] Error during queue processing` that the queue then
 * retries forever (the failing batch is never cleared), spamming the log every ~500ms.
 * The depth at which it trips depends on runtime stack headroom, which is why it can fire
 * in the Overwolf/Chromium app yet never reproduce under Node/Jest. An explicit work
 * queue removes the call-stack ceiling entirely - clone depth is now bounded only by heap.
 */
function deepClone<T>(rootValue: T, seen: WeakMap<object, unknown>, preserve: WeakSet<object>): T {
	// Special case: HearthstoneReplay.Games is the only mutable bit - the replay itself is
	// lightweight, so it falls through to the generic object path in `cloneShell`.
	// (References retained only to document intent; the generic path handles them.)
	void HearthstoneReplay;
	void GameState;

	// Source containers whose clone shell exists and is registered in `seen`, but whose
	// children have not been copied across yet. Drained by the loop below.
	const pending: object[] = [];

	// Return the clone of `value`, creating its shell (and scheduling its fill) on first
	// encounter. Leaves are returned directly. This never recurses, so an arbitrarily deep
	// source graph cannot overflow the call stack.
	const cloneShell = (value: unknown): unknown => {
		if (value == null) return value;
		const t = typeof value;
		if (t !== 'object' && t !== 'function') return value;
		if (t === 'function') return value;

		const obj = value as object;
		if (preserve.has(obj)) return value;
		const already = seen.get(obj);
		if (already !== undefined) return already;

		// Leaves: fully cloned now, no children to schedule.
		if (obj instanceof Date) {
			const copy = new Date(obj.getTime());
			seen.set(obj, copy);
			return copy;
		}
		if (obj instanceof RegExp) {
			const copy = new RegExp(obj.source, obj.flags);
			seen.set(obj, copy);
			return copy;
		}

		// Containers: register an empty shell immediately (so cycles resolve to it), then
		// defer copying children to the work loop.
		if (obj instanceof Map) {
			const copy = new Map();
			seen.set(obj, copy);
			pending.push(obj);
			return copy;
		}
		if (obj instanceof Set) {
			const copy = new Set();
			seen.set(obj, copy);
			pending.push(obj);
			return copy;
		}
		if (Array.isArray(obj)) {
			const copy: unknown[] = new Array(obj.length);
			seen.set(obj, copy);
			pending.push(obj);
			return copy;
		}
		const proto = Object.getPrototypeOf(obj);
		const copy = Object.create(proto) as Record<string, unknown>;
		seen.set(obj, copy);
		pending.push(obj);
		return copy;
	};

	const root = cloneShell(rootValue);

	while (pending.length > 0) {
		const src = pending.pop()!;
		const dst = seen.get(src)!;
		if (src instanceof Map) {
			const target = dst as Map<unknown, unknown>;
			for (const [k, v] of src.entries()) {
				target.set(cloneShell(k), cloneShell(v));
			}
		} else if (src instanceof Set) {
			const target = dst as Set<unknown>;
			for (const v of src.values()) {
				target.add(cloneShell(v));
			}
		} else if (Array.isArray(src)) {
			const target = dst as unknown[];
			const srcArr = src as unknown[];
			for (let i = 0; i < srcArr.length; i++) {
				target[i] = cloneShell(srcArr[i]);
			}
		} else {
			const target = dst as Record<string, unknown>;
			const srcObj = src as Record<string, unknown>;
			for (const key of Object.keys(srcObj)) {
				target[key] = cloneShell(srcObj[key]);
			}
		}
	}

	return root as T;
}
