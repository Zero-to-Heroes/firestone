/**
 * Regression: "Wrong secrets" via Sands of Time rewind.
 *
 * Power-log narrative (entity ids from the reporter log):
 *  - Sands of Time #2 (entity 18, `TIME_EVENT_999`, `tag=REWIND value=1`) plays a `BlockType=POWER`
 *    that fires a Sands discover. Inside the same root block, **The Origin Stone** trigger
 *    (entity 161, `TLC_460t`) creates entity **219** as a Hunter SECRET (`tag=SECRET value=1`,
 *    `tag=CLASS value=HUNTER`, `tag=ZONE value=SECRET`).
 *  - Sands then emits `BlockType=GAME_RESET` (root rewind). On the post-rewind branch the
 *    discover is re-resolved with a different choice; The Origin Stone re-fires and
 *    re-binds **the same id 219** with `SHOW_ENTITY ... CardID=TLC_462` (*Unearthed Artifacts*,
 *    EPIC Mage SPELL, NOT a secret), going straight `SETASIDE → PLAY → GRAVEYARD`.
 *  - The only `TAG_CHANGE Entity=219 tag=ZONE` lines in the log are `→ SECRET` (pre-rewind) and
 *    `→ GRAVEYARD` (post-rewind, as TLC_462). There is no intermediate `SECRET → PLAY` event,
 *    so a secret-helper that doesn't roll back across the rewind has no natural hook to evict
 *    219 from `opponentDeck.secrets`.
 *
 * Expected (post-fix): the parser-side {@link RewindController} snapshots state at Sands' root
 * `BLOCK_START` (before 219 ever existed) and the consumer-side `GameStateService` mirrors that.
 * On `GAME_RESET` both restore wholesale, so entity 219 is no longer in `opponentDeck.secrets`
 * by end of replay; the post-rewind TLC_462 reveal goes to `PLAY` and never enters `SECRET`.
 *
 * Fixture: full game from `CREATE_GAME` through end of the Sands-of-Time PowerTaskList stream
 * (the rewind cycle plus the post-rewind re-PLAY of Sands and the new 219 reveal/disposal).
 * Trim is **head -n 26556** of the reporter export; cuts on a clean `EndCurrentTaskList` boundary
 * just before the next top-level `DebugPrintPowerList` (Ancient Kraken `CORE_BAR_541` play).
 *
 * Run:
 *   export HS_REFERENCE_CARDS_JSON_PATH=https://raw.githubusercontent.com/Zero-to-Heroes/hs-reference-data/master/src/cards_short.json
 *   npx jest test-tools/bugs/wrong-secrets/power-log-wrong-secrets-replay.spec.ts --config=libs/game-state/jest.config.ts --runInBand
 */
import * as fs from 'fs';
import { trimPowerLogLinesToLastGame } from '../../lib/trim-power-log-last-game';
import {
	replayPowerLogToGameState,
	requirePowerLogFixtureExists,
	requirePowerLogReplayPrerequisites,
	requirePowerLogReplayResult,
	resolveCardsJsonPath,
	resolvePowerLogPathForSlug,
} from '../../lib/power-log-replay-harness';
import {
	REWOUND_SECRET_ENTITY_ID,
	logShowsEntity219EnteringSecretAsHunter,
	logShowsEntity219RevealedAsUnearthedArtifacts,
	logShowsSandsOfTimeWithRewindMechanic,
} from './wrong-secrets-power-log-helpers';

describe('Power log replay → GameStateService (Sands of Time rewind invalidates pre-rewind secrets)', () => {
	it('fixture: log captures Sands-of-Time rewind that re-binds entity 219 from Hunter SECRET to TLC_462', () => {
		const logPath = resolvePowerLogPathForSlug('wrong-secrets');
		requirePowerLogFixtureExists(logPath);
		const raw = fs.readFileSync(logPath, 'utf8');
		const lines = trimPowerLogLinesToLastGame(raw.split(/\r?\n/));
		expect(logShowsSandsOfTimeWithRewindMechanic(lines)).toBe(true);
		expect(logShowsEntity219EnteringSecretAsHunter(lines)).toBe(true);
		expect(logShowsEntity219RevealedAsUnearthedArtifacts(lines)).toBe(true);
	});

	it(
		'after replay, opponentDeck.secrets must NOT contain entity 219 (rewind invalidates the pre-rewind Hunter secret)',
		async () => {
			const logPath = resolvePowerLogPathForSlug('wrong-secrets');
			const cardsPath = resolveCardsJsonPath();
			requirePowerLogReplayPrerequisites(cardsPath, logPath);
			const ctx = await replayPowerLogToGameState({
				logPath,
				reviewId: 'wrong-secrets-power-log-replay',
				settleMs: 8000,
			});
			requirePowerLogReplayResult(ctx, cardsPath);
			const stillThere = ctx.state.opponentDeck.secrets.filter((s) => s.entityId === REWOUND_SECRET_ENTITY_ID);
			expect(stillThere.map((s) => ({ entityId: s.entityId, cardId: s.cardId }))).toEqual([]);
		},
		600_000,
	);
});
