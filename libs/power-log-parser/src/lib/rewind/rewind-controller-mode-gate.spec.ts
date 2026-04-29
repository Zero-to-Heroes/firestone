/**
 * Unit test for the per-game-mode gate on {@link RewindController}.
 *
 * REWIND-capable cards only exist in Constructed / Tavern Brawl / Adventure / Arena: none of
 * the Battlegrounds modes (incl. Duos / Friendly) and none of the Mercenaries modes ship a
 * card with the REWIND mechanic. Running the controller's depth tracker / pending stash for
 * those games is pure overhead, so we latch a `skipForGameMode = true` decision the first
 * time we see a confirmed mode and short-circuit every public observer.
 *
 * The controller only touches `CombinedState` via three call sites:
 *   - `state.GSState.IsBattlegrounds()`
 *   - `state.GSState.IsMercenaries()`
 *   - `state.GSState.CurrentGame.GameType`
 * Mocking just those keeps this test fast and isolated from the rest of the parser.
 */
import { GameType } from '@firestone-hs/reference-data';
import { CombinedState } from '../state/combined-state';
import { RewindCardOracle } from './card-oracle';
import { RewindController } from './rewind-controller';

type MutableMock = {
	gameType: number;
	isBg: boolean;
	isMerc: boolean;
};

function makeStub(modeMock: MutableMock): CombinedState {
	const gsState = {
		CurrentGame: {
			get GameType() {
				return modeMock.gameType;
			},
		},
		IsBattlegrounds: () => modeMock.isBg,
		IsMercenaries: () => modeMock.isMerc,
	};
	return { GSState: gsState, PTLState: gsState } as unknown as CombinedState;
}

const NEVER_REWIND_ORACLE: RewindCardOracle = {
	hasRewindMechanic: () => false,
};

describe('RewindController game-mode gate', () => {
	it('latches skip=true for Battlegrounds and no-ops every observer', () => {
		const mock: MutableMock = {
			gameType: GameType.GT_BATTLEGROUNDS as number,
			isBg: true,
			isMerc: false,
		};
		const controller = new RewindController(makeStub(mock), NEVER_REWIND_ORACLE);

		controller.onBlockStart('GS', 99, null, 'PLAY', '00:00:00.000', true);
		controller.onShowEntity(99, 'EX1_001');
		controller.onBlockEnd('GS');

		expect(controller._pendingSize()).toBe(0);
		expect(controller._retainedSize()).toBe(0);
		expect(controller.onGsGameResetStart(99)).toBeNull();
		expect(controller.onPtlGameResetStart(99)).toBeNull();
	});

	it('latches skip=true for Mercenaries and no-ops every observer', () => {
		const mock: MutableMock = {
			gameType: GameType.GT_MERCENARIES_PVP as number,
			isBg: false,
			isMerc: true,
		};
		const controller = new RewindController(makeStub(mock), NEVER_REWIND_ORACLE);

		controller.onBlockStart('GS', 42, null, 'PLAY', '00:00:00.000', true);
		controller.onBlockEnd('GS');

		expect(controller._pendingSize()).toBe(0);
		expect(controller._retainedSize()).toBe(0);
	});

	it('does not skip for Constructed games', () => {
		const mock: MutableMock = {
			gameType: GameType.GT_RANKED as number,
			isBg: false,
			isMerc: false,
		};
		const controller = new RewindController(makeStub(mock), NEVER_REWIND_ORACLE);

		controller.onBlockStart('GS', 7, null, 'PLAY', '00:00:00.000', true);
		expect(controller._pendingSize()).toBe(1);
	});

	it('defers the latch while GameType is unknown (-1) and re-checks later', () => {
		const mock: MutableMock = {
			gameType: -1,
			isBg: false,
			isMerc: false,
		};
		const controller = new RewindController(makeStub(mock), NEVER_REWIND_ORACLE);

		// Pre-metadata: GameType=-1 means we can't decide yet, so the regular path runs and
		// stashes the pending meta. In practice no real BLOCK_START arrives this early, but
		// the controller must still behave correctly if one does.
		controller.onBlockStart('GS', 7, null, 'PLAY', '00:00:00.000', true);
		expect(controller._pendingSize()).toBe(1);

		// Now metadata lands and the mode is revealed as Battlegrounds. The next observer
		// call should latch skip=true and stop touching state from this point on.
		mock.gameType = GameType.GT_BATTLEGROUNDS as number;
		mock.isBg = true;
		controller.onShowEntity(7, 'EX1_001');
		// Pre-existing pending entry stays untouched (the gate stops *new* work, it does not
		// retroactively clean up anything captured before the latch). That's fine: BG games
		// don't restore from rewind so the entry is harmless and is GC'd on `reset()`.
		expect(controller._retainedSize()).toBe(0);
	});

	it('clears the latch on reset() so a Constructed game after BG is processed normally', () => {
		const mock: MutableMock = {
			gameType: GameType.GT_BATTLEGROUNDS as number,
			isBg: true,
			isMerc: false,
		};
		const controller = new RewindController(makeStub(mock), NEVER_REWIND_ORACLE);
		controller.onBlockStart('GS', 1, null, 'PLAY', '00:00:00.000', true);
		expect(controller._pendingSize()).toBe(0);

		mock.gameType = GameType.GT_RANKED as number;
		mock.isBg = false;
		controller.reset();

		controller.onBlockStart('GS', 2, null, 'PLAY', '00:00:01.000', true);
		expect(controller._pendingSize()).toBe(1);
	});
});
