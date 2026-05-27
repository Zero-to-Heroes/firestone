/**
 * Phase B invariants on {@link RewindController}.
 *
 * Asserts that the two snapshot pipelines (GS and PTL) are fully independent: each stream
 * captures into its own LIFO stack, restores from its own stack at its own GAME_RESET, and
 * the `onRewindCapableActionStart` consumer hook fires exactly once per rewind-capable
 * action (from the GS-side capture - the symmetric PTL capture is intentionally silent).
 *
 * These assertions are what prevents a regression of the amalgam-atk bug class: the bug was
 * specifically that the PTL half was captured at a GS-stream moment, and these tests pin
 * "each stream snapshots itself" as a hard contract.
 *
 * The snapshot module is mocked out - we don't care here whether the deep-clone reproduces
 * a faithful ParserState, only whether the controller's bookkeeping moves entries between
 * the right collections at the right times.
 */
import { GameType } from '@firestone-hs/reference-data';
import { CombinedState } from '../state/combined-state';
import { RewindCardOracle } from './card-oracle';
import { RewindController, RewindControllerHooks } from './rewind-controller';
import { ParserSnapshotMeta } from './snapshot';

// Stub the deep-clone helpers: the controller's contract is about WHICH stack/map an
// originEntityId lives in, not whether the captured payload is byte-identical. Each
// captureParserSnapshot call returns a unique sentinel so we can assert "this restore got
// the snapshot we expect".
let captureCallCounter = 0;
const captureCalls: Array<{ stateLabel: string; meta: ParserSnapshotMeta; sentinel: number }> = [];
const restoreCalls: Array<{ stateLabel: string; sentinel: number }> = [];

jest.mock('./snapshot', () => ({
	captureParserSnapshot: jest.fn((state: { _label: string }, meta: ParserSnapshotMeta) => {
		captureCallCounter += 1;
		const sentinel = captureCallCounter;
		captureCalls.push({ stateLabel: state._label, meta, sentinel });
		return { ...meta, fields: { _sentinel: sentinel } };
	}),
	restoreParserSnapshot: jest.fn((state: { _label: string }, snapshot: { fields: { _sentinel: number } }) => {
		restoreCalls.push({ stateLabel: state._label, sentinel: snapshot.fields._sentinel });
	}),
}));

const ALWAYS_REWIND_ORACLE: RewindCardOracle = {
	hasRewindMechanic: (cardId) => cardId === 'REWIND_CARD',
};

function makeStub(): CombinedState {
	const gameMode = {
		CurrentGame: { GameType: GameType.GT_RANKED as number },
		IsBattlegrounds: () => false,
		IsMercenaries: () => false,
	};
	return {
		GSState: { _label: 'GS', ...gameMode },
		PTLState: { _label: 'PTL', ...gameMode },
	} as unknown as CombinedState;
}

function makeController(hooks: RewindControllerHooks = {}): RewindController {
	return new RewindController(makeStub(), ALWAYS_REWIND_ORACLE, hooks);
}

beforeEach(() => {
	captureCallCounter = 0;
	captureCalls.length = 0;
	restoreCalls.length = 0;
});

describe('RewindController per-stream invariants (Phase B)', () => {
	describe('eager path (known REWIND cardId at BLOCK_START)', () => {
		it('captures GS half into gsRetained on GS root BLOCK_START', () => {
			const controller = makeController();
			controller.onBlockStart('GS', 116, 'REWIND_CARD', 'PLAY', '00:00:00.000', true);

			expect(controller._gsRetainedSize()).toBe(1);
			expect(controller._ptlRetainedSize()).toBe(0);
			expect(captureCalls).toHaveLength(1);
			expect(captureCalls[0].stateLabel).toBe('GS');
		});

		it('captures PTL half into ptlRetained on PTL root BLOCK_START (independent of GS)', () => {
			const controller = makeController();
			controller.onBlockStart('GS', 116, 'REWIND_CARD', 'PLAY', '00:00:00.000', true);
			controller.onBlockStart('PTL', 116, 'REWIND_CARD', 'PLAY', '00:00:01.000', true);

			expect(controller._gsRetainedSize()).toBe(1);
			expect(controller._ptlRetainedSize()).toBe(1);
			expect(captureCalls).toHaveLength(2);
			expect(captureCalls.map((c) => c.stateLabel)).toEqual(['GS', 'PTL']);
		});

		it('fires the consumer hook exactly once per action (on the GS-side capture)', () => {
			const hook = jest.fn();
			const controller = makeController({ onRewindCapableActionStart: hook });
			controller.onBlockStart('GS', 116, 'REWIND_CARD', 'PLAY', '00:00:00.000', true);
			controller.onBlockStart('PTL', 116, 'REWIND_CARD', 'PLAY', '00:00:01.000', true);

			expect(hook).toHaveBeenCalledTimes(1);
			expect(hook).toHaveBeenCalledWith(
				expect.objectContaining({
					originEntityId: 116,
					originCardId: 'REWIND_CARD',
					capturedAt: '00:00:00.000',
				}),
			);
		});

		it('does not snapshot when cardId is known but not REWIND-capable', () => {
			const controller = makeController();
			controller.onBlockStart('GS', 7, 'NOT_REWIND', 'PLAY', '00:00:00.000', true);
			controller.onBlockStart('PTL', 7, 'NOT_REWIND', 'PLAY', '00:00:01.000', true);

			expect(controller._gsRetainedSize()).toBe(0);
			expect(controller._ptlRetainedSize()).toBe(0);
			expect(controller._gsPendingSize()).toBe(0);
			expect(controller._ptlPendingSize()).toBe(0);
			expect(captureCalls).toHaveLength(0);
		});
	});

	describe('deferred path (unknown cardId at BLOCK_START)', () => {
		it('stashes meta-only into pending on each stream', () => {
			const controller = makeController();
			controller.onBlockStart('GS', 22, null, 'PLAY', '00:00:00.000', true);
			controller.onBlockStart('PTL', 22, null, 'PLAY', '00:00:01.000', true);

			expect(controller._gsPendingSize()).toBe(1);
			expect(controller._ptlPendingSize()).toBe(1);
			expect(controller._gsRetainedSize()).toBe(0);
			expect(controller._ptlRetainedSize()).toBe(0);
			expect(captureCalls).toHaveLength(0);
		});

		it('captures on GS-stream SHOW_ENTITY when REWIND-capable; only GS hook fires', () => {
			const hook = jest.fn();
			const controller = makeController({ onRewindCapableActionStart: hook });
			controller.onBlockStart('GS', 22, null, 'PLAY', '00:00:00.000', true);
			controller.onBlockStart('PTL', 22, null, 'PLAY', '00:00:01.000', true);
			controller.onShowEntity('GS', 22, 'REWIND_CARD');

			expect(controller._gsRetainedSize()).toBe(1);
			expect(controller._ptlRetainedSize()).toBe(0);
			expect(controller._gsPendingSize()).toBe(0);
			expect(controller._ptlPendingSize()).toBe(1);
			expect(hook).toHaveBeenCalledTimes(1);
		});

		it('captures on PTL-stream SHOW_ENTITY without firing the hook', () => {
			const hook = jest.fn();
			const controller = makeController({ onRewindCapableActionStart: hook });
			controller.onBlockStart('GS', 22, null, 'PLAY', '00:00:00.000', true);
			controller.onBlockStart('PTL', 22, null, 'PLAY', '00:00:01.000', true);
			controller.onShowEntity('GS', 22, 'REWIND_CARD');
			controller.onShowEntity('PTL', 22, 'REWIND_CARD');

			expect(controller._gsRetainedSize()).toBe(1);
			expect(controller._ptlRetainedSize()).toBe(1);
			expect(controller._gsPendingSize()).toBe(0);
			expect(controller._ptlPendingSize()).toBe(0);
			expect(hook).toHaveBeenCalledTimes(1);
		});

		it('discards pending meta on SHOW_ENTITY when revealed cardId is not REWIND-capable', () => {
			const controller = makeController();
			controller.onBlockStart('GS', 22, null, 'PLAY', '00:00:00.000', true);
			controller.onShowEntity('GS', 22, 'NOT_REWIND');

			expect(controller._gsRetainedSize()).toBe(0);
			expect(controller._gsPendingSize()).toBe(0);
		});

		it('drops pending meta on root BLOCK_END when SHOW_ENTITY never confirmed', () => {
			const controller = makeController();
			controller.onBlockStart('GS', 22, null, 'PLAY', '00:00:00.000', true);
			controller.onBlockStart('PTL', 22, null, 'PLAY', '00:00:01.000', true);
			controller.onBlockEnd('GS');
			controller.onBlockEnd('PTL');

			expect(controller._gsPendingSize()).toBe(0);
			expect(controller._ptlPendingSize()).toBe(0);
			expect(controller._gsRetainedSize()).toBe(0);
			expect(controller._ptlRetainedSize()).toBe(0);
		});
	});

	describe('restore (GAME_RESET)', () => {
		it('GS GAME_RESET pops only from gsRetained and restores GSState', () => {
			const controller = makeController();
			controller.onBlockStart('GS', 116, 'REWIND_CARD', 'PLAY', '00:00:00.000', true);
			controller.onBlockStart('PTL', 116, 'REWIND_CARD', 'PLAY', '00:00:01.000', true);

			const meta = controller.onGsGameResetStart(116);

			expect(meta).not.toBeNull();
			expect(meta?.originEntityId).toBe(116);
			expect(controller._gsRetainedSize()).toBe(0);
			expect(controller._ptlRetainedSize()).toBe(1);
			expect(restoreCalls).toHaveLength(1);
			expect(restoreCalls[0].stateLabel).toBe('GS');
		});

		it('PTL GAME_RESET pops only from ptlRetained and restores PTLState', () => {
			const controller = makeController();
			controller.onBlockStart('GS', 116, 'REWIND_CARD', 'PLAY', '00:00:00.000', true);
			controller.onBlockStart('PTL', 116, 'REWIND_CARD', 'PLAY', '00:00:01.000', true);
			controller.onGsGameResetStart(116);

			const meta = controller.onPtlGameResetStart(116);

			expect(meta).not.toBeNull();
			expect(controller._gsRetainedSize()).toBe(0);
			expect(controller._ptlRetainedSize()).toBe(0);
			expect(restoreCalls).toHaveLength(2);
			expect(restoreCalls[1].stateLabel).toBe('PTL');
		});

		it('returns null and emits no restore when no matching entry exists', () => {
			const controller = makeController();
			expect(controller.onGsGameResetStart(999)).toBeNull();
			expect(controller.onPtlGameResetStart(999)).toBeNull();
			expect(restoreCalls).toHaveLength(0);
		});

		it('handles half-captured rewinds (GS captured, PTL did not) via per-stream null fallback', () => {
			// Pathological case: PTL never reached BLOCK_START for the rewound action. GS
			// restores normally; PTL falls through to its legacy path via the null return.
			const controller = makeController();
			controller.onBlockStart('GS', 116, 'REWIND_CARD', 'PLAY', '00:00:00.000', true);

			expect(controller.onGsGameResetStart(116)).not.toBeNull();
			expect(controller.onPtlGameResetStart(116)).toBeNull();
			expect(controller._gsRetainedSize()).toBe(0);
			expect(controller._ptlRetainedSize()).toBe(0);
		});
	});

	describe('LIFO semantics and nested rewinds', () => {
		it('matches GAME_RESET to the most recent capture for the same originEntityId', () => {
			const controller = makeController();
			controller.onBlockStart('GS', 5, 'REWIND_CARD', 'PLAY', '00:00:00.000', true);
			controller.onBlockEnd('GS');
			controller.onBlockStart('GS', 5, 'REWIND_CARD', 'PLAY', '00:00:02.000', true);

			expect(controller._gsRetainedSize()).toBe(2);
			const meta = controller.onGsGameResetStart(5);
			expect(meta?.capturedAt).toBe('00:00:02.000');
			expect(controller._gsRetainedSize()).toBe(1);
		});

		it('fires the hook again on a fresh rewind of the same entity', () => {
			const hook = jest.fn();
			const controller = makeController({ onRewindCapableActionStart: hook });
			controller.onBlockStart('GS', 5, 'REWIND_CARD', 'PLAY', '00:00:00.000', true);
			controller.onBlockEnd('GS');
			controller.onBlockStart('GS', 5, 'REWIND_CARD', 'PLAY', '00:00:02.000', true);

			expect(hook).toHaveBeenCalledTimes(2);
		});
	});

	describe('reset()', () => {
		it('clears every per-stream collection', () => {
			const controller = makeController();
			// First (rewind-known) action - drives gsRetained / ptlRetained.
			controller.onBlockStart('GS', 116, 'REWIND_CARD', 'PLAY', '00:00:00.000', true);
			controller.onBlockStart('PTL', 116, 'REWIND_CARD', 'PLAY', '00:00:01.000', true);
			controller.onBlockEnd('GS');
			controller.onBlockEnd('PTL');
			// Second (deferred) action - drives gsPending / ptlPending without confirming.
			controller.onBlockStart('GS', 22, null, 'PLAY', '00:00:02.000', true);
			controller.onBlockStart('PTL', 22, null, 'PLAY', '00:00:03.000', true);

			expect(controller._gsRetainedSize()).toBe(1);
			expect(controller._ptlRetainedSize()).toBe(1);
			expect(controller._gsPendingSize()).toBe(1);
			expect(controller._ptlPendingSize()).toBe(1);

			controller.reset();

			expect(controller._gsRetainedSize()).toBe(0);
			expect(controller._ptlRetainedSize()).toBe(0);
			expect(controller._gsPendingSize()).toBe(0);
			expect(controller._ptlPendingSize()).toBe(0);
		});

		it('lets a fresh rewind after reset() fire the hook again', () => {
			const hook = jest.fn();
			const controller = makeController({ onRewindCapableActionStart: hook });
			controller.onBlockStart('GS', 116, 'REWIND_CARD', 'PLAY', '00:00:00.000', true);
			expect(hook).toHaveBeenCalledTimes(1);

			controller.reset();
			controller.onBlockStart('GS', 116, 'REWIND_CARD', 'PLAY', '00:00:10.000', true);

			expect(hook).toHaveBeenCalledTimes(2);
		});
	});
});
