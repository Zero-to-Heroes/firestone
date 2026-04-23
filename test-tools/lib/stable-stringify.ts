/**
 * Deterministic JSON serialization for GameState snapshots used in regression tests.
 *
 * The serialized output feeds golden comparisons, so it must be:
 *   - order-stable (sort object keys; sort Map entries by key),
 *   - cycle-safe (short-circuit on repeat references),
 *   - scrubbed of absolute timestamps and other replay-environment noise,
 *   - free of parser-internal structures that are slated to change shape in this refactor.
 *
 * Use {@link stableStringifyGameState} for the full GameState path. The lower-level
 * {@link stableStringify} is exported for ad-hoc use and tests of the helper itself.
 */

export interface StableStringifyOptions {
	readonly indent?: number | string;
	readonly scrubKeys?: readonly string[];
	readonly dropKeys?: readonly string[];
}

const PLACEHOLDER_SCRUBBED = '<scrubbed>';

const DEFAULT_SCRUB_KEYS: readonly string[] = [
	'matchStartTimestamp',
	'timestampAtWhichCardEnteredHand',
	'TimeStamp',
	'creationTimestamp',
	// ShortCardWithTurn.timestamp: a Date.now()-based field stamped on cards played, so it
	// drifts between runs even when replaying the same log. The turn-granular info (turn,
	// playTiming) is still asserted.
	'timestamp',
	// `internalEntityId` is a per-run uuidShort() stamped on every DeckCard. It is stable
	// within a run but differs across runs; for golden comparisons we treat it as opaque.
	'internalEntityId',
];

/**
 * Keys to drop entirely from the serialization. `parserState` is the parser's
 * internal GameState (with back-references to ParserState and a full node tree)
 * which is exactly what the rewind refactor reshapes - comparing it would produce
 * false diffs. The rewind regression contract is about the consumer-observable
 * GameState only.
 */
const DEFAULT_DROP_KEYS: readonly string[] = ['parserState'];

export function stableStringifyGameState(state: unknown, options: StableStringifyOptions = {}): string {
	return stableStringify(state, {
		indent: options.indent ?? 2,
		scrubKeys: options.scrubKeys ?? DEFAULT_SCRUB_KEYS,
		dropKeys: options.dropKeys ?? DEFAULT_DROP_KEYS,
	});
}

export function stableStringify(value: unknown, options: StableStringifyOptions = {}): string {
	const indent = options.indent ?? 0;
	const scrubKeys = new Set(options.scrubKeys ?? []);
	const dropKeys = new Set(options.dropKeys ?? []);
	const seen = new WeakSet<object>();

	const normalized = normalize(value, seen, scrubKeys, dropKeys);
	return JSON.stringify(normalized, null, indent);
}

function normalize(
	value: unknown,
	seen: WeakSet<object>,
	scrubKeys: Set<string>,
	dropKeys: Set<string>,
): unknown {
	if (value == null) return value as null | undefined;
	if (typeof value !== 'object') {
		if (typeof value === 'function' || typeof value === 'symbol') return undefined;
		if (typeof value === 'bigint') return value.toString();
		return value;
	}
	if (seen.has(value as object)) return '<cycle>';
	seen.add(value as object);

	if (value instanceof Map) {
		const entries = [...value.entries()].map(([k, v]) => [
			typeof k === 'object' && k !== null ? JSON.stringify(k) : String(k),
			normalize(v, seen, scrubKeys, dropKeys),
		]);
		entries.sort((a, b) => (a[0] as string).localeCompare(b[0] as string));
		return { __map__: entries };
	}
	if (value instanceof Set) {
		const items = [...value].map((v) => normalize(v, seen, scrubKeys, dropKeys));
		items.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
		return { __set__: items };
	}
	if (Array.isArray(value)) {
		return value.map((v) => normalize(v, seen, scrubKeys, dropKeys));
	}

	const out: Record<string, unknown> = {};
	const keys = Object.keys(value as Record<string, unknown>).sort();
	for (const k of keys) {
		if (dropKeys.has(k)) continue;
		const v = (value as Record<string, unknown>)[k];
		if (scrubKeys.has(k)) {
			out[k] = v == null ? null : PLACEHOLDER_SCRUBBED;
			continue;
		}
		out[k] = normalize(v, seen, scrubKeys, dropKeys);
	}
	return out;
}
